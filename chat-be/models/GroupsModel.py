from app import db

# Association table for the many-to-many relationship
group_user_association = db.Table('group_user',
                                  db.Column('group_id', db.Integer, db.ForeignKey('groups.id')),
                                  db.Column('user_id', db.Integer, db.ForeignKey('user.id'))
                                  )


class Groups(db.Model):
    __tablename__ = 'groups'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    users = db.relationship('User', secondary=group_user_association, backref='groups')