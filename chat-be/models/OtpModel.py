from app import db
from datetime import datetime, timedelta

class Otp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Assuming you have a User model
    otp = db.Column(db.String(6), nullable=False)  # Store OTP as a string, adjust length if needed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # Timestamp for when OTP is created
    expires_at = db.Column(db.DateTime, nullable=False)  # Expiration time for the OTP

    def __init__(self, user_id, otp, valid_for_minutes=5):
        self.user_id = user_id
        self.otp = otp
        self.expires_at = datetime.utcnow() + timedelta(minutes=valid_for_minutes)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at  # Check if the OTP is still valid
