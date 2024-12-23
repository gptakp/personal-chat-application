from app import ma

class TempaltesSchema(ma.Schema):
    class Meta:
        fields = ('id', 'template')

templates_serializer = TempaltesSchema()
templates_serializers = TempaltesSchema(many=True)