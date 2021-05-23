from datetime import datetime
from django.views.generic import ListView

from .models import specifications
from django.http import HttpRequest, HttpResponseRedirect

from django.contrib.auth.models import User

from django.shortcuts import render
from .forms import SpecifForm, RegisterForm


class BaseView(ListView):
    paginate_by = 20
    model = specifications
    template_name = "index.html"
    queryset = specifications.objects.all().order_by('-date')

    def post(self, request, *args, **kwargs):
        form_filter = SpecifForm(request.POST)
        if form_filter.is_valid():
            spec = filter_spec(self.queryset, form_filter)
            return render(request, self.template_name, {'object_list': spec})


def filter_spec(spec, form_filter):
    if form_filter.cleaned_data['specification_name']:
        spec = spec.filter(name_specification=form_filter.cleaned_data['specification_name'])

    if form_filter.cleaned_data['renewal_date'] and form_filter.cleaned_data['renewal_date2']:
        if not (form_filter.cleaned_data['renewal_date'] > form_filter.cleaned_data['renewal_date2']):
            spec = spec.filter(date__range=[form_filter.cleaned_data['renewal_date'],
                                            form_filter.cleaned_data['renewal_date2']])
    if form_filter.cleaned_data['author_name']:
        spec = spec.filter(author=form_filter.cleaned_data['author_name'])

    if form_filter.cleaned_data['version_name']:
        spec = spec.filter(version=form_filter.cleaned_data['version_name'])

    if form_filter.cleaned_data['tag_name']:
        spec = filter_by_tags(spec, form_filter.cleaned_data['tag_name'])
    return spec

def filter_by_tags(spec, tags: str):
    tags_split = tags.replace(',', ' ').split()
    for tag in tags_split:
        spec = spec.filter(tags__name=tag)
    return spec

def by_author(request, author_name):
    specif = specifications.objects.filter(author=author_name)
    authors = User.objects.all()
    context = {'bbs': specif, 'author': authors}
    return render(request, 'author.html', context)

def registration(request):
    assert isinstance(request, HttpRequest)
    if request.method == "POST":
        regform = RegisterForm(request.POST)
        if regform.is_valid():
            reg_f = regform.save(commit=False)
            reg_f.is_staff = False
            reg_f.is_active = True
            reg_f.is_superuser = False
            reg_f.date_joined = datetime.now()
            reg_f.last_login = datetime.now()
            reg_f.save()

            return HttpResponseRedirect('http://127.0.0.1:8000/')
    else:
        regform = RegisterForm()  # создание объекта формы для ввода данных нового пользователя
        assert isinstance(request, HttpRequest)
    return render(request, 'registration/registration.html',
                  {
            'regform': regform,  # передача формы в шаблон веб-страницы
            'year': datetime.now().year,
        })

def view_specification(request, pk):
    if request.method == "GET":
        specif = specifications.objects.filter(pk=pk).get()
        text = specif.text_specification

        context = {'library': specif, 'text': text}
        return render(request, 'view_specifications.html', context)

def view_graph(request, pk):
    if request.method == "GET":
        specif = specifications.objects.filter(pk=pk).get()
        text = specif.json_text

        context = {'library': specif, 'textJson': text, 'pk': pk}
        return render(request, 'graph.html', context)


