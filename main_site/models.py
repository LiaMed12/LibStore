from django.contrib.auth.models import User
from django.db import models

User._meta.get_field('email').blank = False


class tags_list(models.Model):
        name = models.CharField(max_length=30, unique=True)

        def __str__(self):
            return self.name


class specifications(models.Model):
    name_specification = models.CharField(max_length=50, db_index=True)
    author = models.ForeignKey(User, to_field='username', max_length=50, on_delete=models.CASCADE)
    date = models.DateField()
    version = models.CharField(max_length=10)
    description = models.TextField()
    text_specification = models.TextField()
    json_text = models.TextField()
    tags = models.ManyToManyField(tags_list)

    def __str__(self):
        return self.name_specification
