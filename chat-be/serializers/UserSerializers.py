from app import ma

class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'username')

user_serializer = UserSchema()
user_serializers = UserSchema(many=True)