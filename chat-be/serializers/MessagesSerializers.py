from app import ma

class MessagesSchema(ma.Schema):
    class Meta:
        fields = ('id', 'user_id', 'connected_user_id','msg')

messages_serializer = MessagesSchema()
messages_serializers = MessagesSchema(many=True)