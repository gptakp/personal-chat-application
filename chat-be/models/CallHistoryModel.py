from app import db

class CallHistory(db.Model):
    __tablename__ = 'call_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    connected_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    call_at = db.Column(db.Text, nullable=False)
    ends_at = db.Column(db.Text, nullable=True, default=None)

    user = db.relationship('User', foreign_keys=[user_id])
    connected_user = db.relationship('User', foreign_keys=[connected_user_id])

    def __repr__(self):
        return f'<ConnectedUsersOfUser user_id={self.user_id}, connected_user_id={self.connected_user_id}>'
