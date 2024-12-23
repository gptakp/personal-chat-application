import json
import random
from datetime import datetime

from flask import request, session, jsonify
from flask_socketio import emit

from app import app, socketio, db
from models.CallHistoryModel import CallHistory
from models.ConnectedUsersOfUserModel import ConnectedUsersOfUser
from models.GroupsModel import Groups
from models.MessagesModel import Messages
from models.OtpModel import Otp
from models.UserModel import User
from werkzeug.security import generate_password_hash, check_password_hash

# Active users dictionary to store online users
from serializers.MessagesSerializers import messages_serializers
from serializers.UserContactsSerializers import user_connected_serializers
from serializers.UserSerializers import user_serializer, user_serializers
from resources.send_mail import SendMail

active_users = {
    'random': {},
    'custom': {}
}

# Create database tables if they do not exist
with app.app_context():
    db.create_all()

@socketio.on('connect_user')
def handle_connect_user(data):
    print('connnect_user')
    username = data.get('username')
    user_type = data.get('type')
    if username and user_type:
        active_users[user_type][username] = {'sid': request.sid, 'status': active_users[user_type].get(username, {}).get('status', 'disconnected'), 'user_data': user_serializer.dump(User.query.filter_by(username=username).first())}


@app.route('/login', methods=['POST'])
def login():
    print('login')
    username = request.form['username']
    password = request.form['password']
    usertype = request.form['type']

    # Validate user credentials
    user = User.query.filter_by(username=username).first()
    response = {"message": "Logged in"}

    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['username'] = user.username
        if usertype == 'custom':
            response['contactUsers'] = user_connected_serializers.dump(ConnectedUsersOfUser.query.filter_by(user_id=user.id).all())
        response['user_data'] = user_serializer.dump(user)
        return response, 200

    return {"message": "Invalid credentials"}, 400


@socketio.on('start_chat')
def handle_start_chat(data):
    print('start_chat')
    username = data.get('username')
    user_type = data.get('type')

    if user_type == 'custom':
        target_username = data.get('target_username')
        user = User.query.filter_by(username=username).first()
        if not user:
            return None
        target_user = User.query.filter_by(username=target_username).first()
        if not target_user:
            return None
        connected_user = ConnectedUsersOfUser.query.filter_by(
            user_id=user.id,
            connected_user_id=target_user.id
        ).first()

        if not connected_user:
            connected_user = ConnectedUsersOfUser.query.filter_by(
                user_id=target_user.id,
                connected_user_id=user.id
            ).first()
        if not connected_user:
            new_connection = ConnectedUsersOfUser(user_id=user.id, connected_user_id=target_user.id)
            db.session.add(new_connection)
            db.session.commit()
        print(active_users)
        matched_partner = active_users[user_type][target_username]

    if user_type == 'random':
        available_users = [user for user in active_users[user_type].keys()
                           if user != username and active_users[user_type][user]['status'] == 'disconnected']
        print(available_users, active_users, username)
        if available_users:
            matched_partner = active_users[user_type][random.choice(available_users)]

    if matched_partner:
        matched_partner = matched_partner['user_data']['username']
        # Update status of both users to connected
        print(active_users)
        active_users[user_type][matched_partner]['status'] = 'connected'
        active_users[user_type][username]['status'] = 'connected'
        active_users[user_type][username]['partner'] = matched_partner
        active_users[user_type][matched_partner]['partner'] = username
        messages = messages_serializers.dump(Messages.query.filter_by(connected_user_id=active_users[user_type][matched_partner]['user_data']['id']).all())
        # Notify both users
        emit('chat_start', {'partner': matched_partner, 'partner_data': active_users[user_type][matched_partner], 'messages':messages}, room=request.sid)
        socketio.emit('chat_start', {'partner': username, 'partner_data': active_users[user_type][username], 'messages': messages}, room=active_users[user_type][matched_partner]['sid'])
    else:
        emit('chat_start', {'partner': None}, room=request.sid)


@socketio.on('chat_message')
def handle_chat_message(data):
    print('chat_message')
    sender_username = data.get('username')
    msg = data.get('msg', '')
    audio = data.get('audio', '')  # Retrieve audio data if present
    recipient_username = data.get('recipient')
    msg_type = data.get('msg_type', 'text')
    user_type = data.get('type')

    recipient_info = active_users[user_type][recipient_username]

    if recipient_info:
        socketio.emit('chat_message', {
            'user_data': active_users[user_type][sender_username]['user_data'],
            'msg': msg,
            'audio': audio,
            'msg_type': msg_type
        }, room=recipient_info['sid'])
    else:
        # Store the message in the Messages table
        new_message = Messages(
            user_id=active_users[user_type][sender_username]['user_data']['id'],
            connected_user_id=active_users[user_type][recipient_username]['user_data']['id'],
            msg=msg
        )
        db.session.add(new_message)
        db.session.commit()

        return jsonify({'message': 'Recipient offline, message stored.'}), 200

@socketio.on('typing')
def handle_typing(data):
    print('typing')
    username = data['username']
    recipient_username = data['recipient']

    user_type = data['type']

    recipient_info = active_users[user_type][recipient_username]

    if recipient_info:
        socketio.emit('typing', {'username': username}, room=recipient_info['sid'])

@app.route('/sendOtp', methods=['POST'])
def send_otp():
    return SendMail.sendMail()

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']

    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return {"message": "User already exists"}, 400

    # Hash the password and create a new user
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    return {"message": "User registered"}, 200


@socketio.on('status')
def handle_answer_call(data):
    socketio.emit('status', {'status':"good"}, room=request.sid)

@app.route('/verifyOtp', methods=['POST'])
def verify_otp():
    username = request.form.get('username')
    otp_value = request.form.get('otp')
    usertype = request.form.get('type')

    if not username or not otp_value:
        return jsonify({"message": "Username and OTP are required"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Query the OTP record for the given user ID and OTP
    otp_record = Otp.query.filter_by(user_id=user.id, otp=otp_value).first()

    if otp_record:
        # Check if the OTP is still valid (not expired)
        if otp_record.is_valid():
            # Successful login logic here
            response = {"message": "Logged in"}
            if usertype == 'custom':
                response['contactUsers'] = user_connected_serializers.dump(
                    ConnectedUsersOfUser.query.filter_by(user_id=user.id).all())
            response['user_data'] = user_serializer.dump(user)
            return response
        else:
            return jsonify({"message": "OTP has expired"}), 400
    else:
        return jsonify({"message": "Invalid OTP"}), 400

@app.route('/connectedUsers', methods=['GET'])
def getConnectedUsersOfUser():
    data = {"user_id": request.args['user_id']}

    if not data or 'user_id' not in data:
        return jsonify({'error': 'user_id is required'}), 400

    user_id = data['user_id']

    # Query to find connections where the user_id matches and the connected_user_id exists in User
    connected_users = (
        db.session.query(ConnectedUsersOfUser, User)
            .join(User, User.id == ConnectedUsersOfUser.connected_user_id)
            .filter(ConnectedUsersOfUser.user_id == user_id)
            .all()
    )

    # Query for reverse connections where connected_user_id matches and the user_id exists in User
    reverse_connections = (
        db.session.query(ConnectedUsersOfUser, User)
            .join(User, User.id == ConnectedUsersOfUser.user_id)
            .filter(ConnectedUsersOfUser.connected_user_id == user_id)
            .all()
    )

    # Combine both sets of connections
    all_connections = connected_users + reverse_connections

    if not all_connections:
        return jsonify({'error': 'No connected users found'}), 404

    # Use a set to keep track of unique connections
    unique_connections = {}
    for record in all_connections:
        user_id = record.ConnectedUsersOfUser.user_id
        connected_user_id = record.ConnectedUsersOfUser.connected_user_id

        # Create a unique key based on user_id and connected_user_id
        key = (user_id, connected_user_id)
        if key not in unique_connections:
            unique_connections[key] = {
                'user_id': user_id,
                'connected_user_id': connected_user_id,
                'connected_user_info': {
                    'id': record.User.id,
                    'username': record.User.username
                }
            }

    # Convert the unique_connections dict to a list
    result = list(unique_connections.values())

    return jsonify({'user_id': user_id, 'connections': result}), 200

@app.route('/getUsers', methods=['GET'])
def getUsers():
    username = request.args['username']

    user = User.query.filter_by(username=username).all()

    return user_serializers.dump(user), 200

@socketio.on('disconnect')
def handle_disconnect(data):
    socketio.emit('callEnded')
    username = None
    user_type = data['type']

    # Find the disconnected user
    for user, info in list(active_users['random'].items()):
        if info['sid'] == request.sid:
            username = user
            break

    # Mark user as disconnected
    if username:
        active_users[user_type][username]['status'] = 'disconnected'
        active_users[user_type][username].pop('partner', None)

@socketio.on('callUser')
def handle_call_user(data):
    print('callUser')
    user_type = data['type']
    new_call = CallHistory(
        user_id=active_users[user_type][data['name']]['user_data']['id'],
        connected_user_id=active_users[user_type][data['userToCall']]['user_data']['id'],
        call_at=datetime.utcnow(),
        ends_at='hgjk'
    )
    db.session.add(new_call)
    db.session.commit()
    socketio.emit('callUser', {'signal': data['signalData'], 'from': data['from'], 'name': active_users[user_type][data['name']]},
                  room=active_users[user_type][data['userToCall']]['sid'])

@socketio.on('answerCall')
def handle_answer_call(data):
    print('answerUser')
    socketio.emit('callAccepted', data['signal'], room=data['to'])

@socketio.on('rejectCall')
def handle_answer_call(data):
    print('rejectCall', data)
    socketio.emit('callRejected', 'call rejected', room=data['to'])


@socketio.on('endCall')
def handle_end_call(data):
    print('End Call')

    # Extract relevant information from the data
    user_type = data['type']
    from_user = data['from']
    to_user = data['to']

    # Optionally, you can handle call history here if you want to log when the call ended
    # For example, you could update the existing CallHistory record
    call_record = CallHistory.query\
        .filter_by(user_id=active_users[user_type][from_user]['user_data']['id'],
                                              connected_user_id=active_users[user_type][to_user]['user_data']['id'])\
        .first()
    if call_record:
        call_record.ends_at = datetime.utcnow()
        db.session.commit()

    # Notify the other user that the call has ended
    socketio.emit('callEnded', {'from': from_user}, room=active_users[user_type][to_user]['sid'])


@app.route('/createGroup', methods=['POST'])
def create_group():
    group_name = request.form.get('group_name')
    user_ids = request.form.get('users')

    if not group_name:
        return {'message': 'group name required'}, 400

    try:
        print(user_ids)
        user_ids = json.loads(user_ids)  # Convert to a list
    except json.JSONDecodeError:
        return {'message': 'Invalid user IDs format'}, 400
    # Create a new group instance

    new_group = Groups(name=group_name)
    # Retrieve user instances and add them to the group
    for user_id in user_ids:
        user = User.query.get(user_id)
        if user:  # Only add valid users
            new_group.users.append(user)

    # Add the new group to the session
    db.session.add(new_group)

    # Commit the session to save the new group to the database
    db.session.commit()
    group_data = {
        'id': new_group.id,
        'name': new_group.name,
        'users': [{'id': u.id, 'name': u.username} for u in new_group.users],
        'members': len(new_group.users)
    }
    return {'message': 'Group created', 'groupData': group_data}

@app.route('/add_user_to_group', methods=['POST'])
def add_user_to_group():
    group_name = request.form.get('group_name')
    user_id = request.form.get('user_id')

    group = Groups.query.filter_by(name=group_name)
    user = User.query.get(user_id)

    if group is None:
        print(f"Group with ID {group_name} does not exist.")
        return {'message': f"Group with ID {group_name} does not exist."}, 400

    if user is None:
        print(f"User with ID {user_id} does not exist.")
        return {'message': f"User with ID {user_id} does not exist."}, 400

    # Check if the user is already in the group
    if user in group.users:
        print(f"User '{user.name}' is already in group '{group.name}'.")
        return {'message': f"User '{user.name}' is already in group '{group.name}'."}, 400

    # Add the user to the group
    group.users.append(user)

    # Commit the changes to save
    db.session.commit()
    group_data = {
        'id': group.id,
        'name': group.name,
        'users': [{'id': u.id, 'name': u.username} for u in group.users],
        'members': len(group.users)
    }
    return {'message': 'Added user to group', 'groupData': group_data}


@app.route('/remove_user_from_group', methods=['POST'])
def remove_user_from_group():
    # Retrieve the group and user from the database
    group_name = request.form.get('group_name')
    user_id = request.form.get('user_id')

    group = Groups.query.filter_by(name=group_name)
    user = User.query.get(user_id)


    if group is None:
        print(f"Group with ID {group_name} does not exist.")
        return {'message': f"Group with ID {group_name} does not exist."}, 400

    if user is None:
        print(f"User with ID {user_id} does not exist.")
        return {'message': f"User with ID {user_id} does not exist."}, 400

    # Check if the user is in the group
    if user not in group.users:
        print(f"User '{user.name}' is not in group '{group.name}'.")
        return {'message': f"User '{user.name}' is not in group '{group.name}'."}, 400

    # Remove the user from the group
    group.users.remove(user)

    # Commit the changes to save
    db.session.commit()
    updated_group_data = {
        'id': group.id,
        'name': group.name,
        'users': [{'id': u.id, 'name': u.username} for u in group.users],
        'members': len(group.users)
    }

    return {'message': 'Removed user', 'updated_group': updated_group_data}, 200

@app.route('/delete_group', methods=['DELETE'])
def delete_group():
    group_name = request.form.get('group_name')
    # Retrieve the group from the database
    group = Groups.query.get(group_name)

    if group is None:
        print(f"Group with ID {group_name} does not exist.")
        return {'message': f"Group with ID {group_name} does not exist."}, 400

    # Remove the group from the session
    db.session.delete(group)

    # Commit the changes to delete the group
    db.session.commit()
    return {'message': 'Deleted'}


@app.route('/user/<int:user_id>/groups', methods=['GET'])
def get_user_groups(user_id):
    # Retrieve the user by ID
    user = User.query.get(user_id)

    if user is None:
        return jsonify({'message': 'User not found'}), 404

    # Get groups associated with the user
    groups = user.groups  # Assuming a relationship named 'groups'

    # Prepare the response with group names and their associated users
    group_list = []
    for group in groups:
        # Gather user details for the group
        user_list = [{'id': u.id, 'name': u.username} for u in group.users]
        group_list.append({
            'id': group.id,
            'name': group.name,
            'users': user_list,
            'members': len(user_list)
        })

    return jsonify(group_list), 200


# Run the application
if __name__ == '__main__':
    socketio.run(app, port=5000, host='0.0.0.0', allow_unsafe_werkzeug=True)
