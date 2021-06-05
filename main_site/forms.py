from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from .models import specifications
from django import forms


class SpecfForm(forms.ModelForm):
    class Meta:
        model = specifications
        fields = ('name_specification', 'author', 'version', 'tags',)


class SpecifForm(forms.Form):
    renewal_date = forms.DateField(required=False)
    renewal_date2 = forms.DateField(required=False)
    specification_name = forms.CharField(required=False)
    tag_name = forms.CharField(required=False)
    version_name = forms.CharField(required=False)
    author_name = forms.CharField(required=False)

    def clean_renewal_date(self):
        data = self.cleaned_data['renewal_date']
        return data

    def clean_renewal_date2(self):
        data = self.cleaned_data['renewal_date2']
        return data

    def get_name(self):
        data = self.cleaned_data['specification_name']
        return data

    def get_author(self):
        data = self.author_data['author_name']
        return data

    def get_tags(self):
        data = self.tags_data['tag_name']
        return data

    def get_version(self):
        data = self.version_data['version_name']
        return data

class SortForm(forms.Form):
    id_zero = forms.IntegerField(required=False)

    def get_zero(self):
        return self.cleaned_data['id_zero']


class RegisterForm(UserCreationForm):
    email = forms.EmailField(label="Email")
    first_name = forms.CharField(label="First name")
    last_name = forms.CharField(label="Last name")

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")


class addSpecifications(forms.Form):
    name_specification = forms.CharField()
    tags = forms.CharField()
    version = forms.CharField()
    description = forms.CharField()

    @property
    def name(self):
        return self.cleaned_data['name_specification']

    @property
    def gettags(self):
        return self.cleaned_data['tags'].replace(',', ' ').split()

    @property
    def getversion(self):
        return self.cleaned_data['version']

    @property
    def getdescription(self):
        return self.cleaned_data['description']

    class Meta:
        model = specifications
        fields = ("name_specification", "version", "tags", "description")
