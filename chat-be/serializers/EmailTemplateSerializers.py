from app import ma

class EmailTempaltesSchema(ma.Schema):
    class Meta:
        fields = ('id', 'template')

email_templates_serializer = EmailTempaltesSchema()
email_templates_serializers = EmailTempaltesSchema(many=True)