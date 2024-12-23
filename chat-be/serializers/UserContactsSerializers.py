from app import ma

class UserContectsSchema(ma.Schema):
    class Meta:
        fields = ('id', 'user_id', 'connected_user_id')

user_connected_serializer = UserContectsSchema()
user_connected_serializers = UserContectsSchema(many=True)