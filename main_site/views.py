import os
from datetime import datetime
import time
import random
import string

from django.core.files.storage import FileSystemStorage
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.views.generic import ListView
from datetime import date

from .models import specifications, tags_list
from django.http import HttpRequest, HttpResponseRedirect

from django.contrib.auth.models import User

from django.shortcuts import render
from .forms import SpecifForm, RegisterForm, SortForm

buffer = None
SortColums = "asc"
tags = ['Python', 'C++', 'C#', 'C', 'Java', 'JS', 'JavaScript', 'Kotlin', 'example', 'Machine', 'Ruby', 'network']

def path_to_file(filename):
    pathFile = os.path.join(os.path.abspath(os.path.dirname(__file__)))
    pathFile += "/resources/{0}".format(filename)
    return pathFile

def add_tags_to(specific, tags):
    for tag in tags:
        try:
            existTag = tags_list.objects.filter(name=tag).get()
        except Exception as e:
            existTag = tags_list.objects.create(name=tag)
        existTag.specifications_set.add(specific)

def addSpecific(size):
    f = open('main_site/resources/SocketServer.lsl', 'r')
    fRead = f.read()
    fJ = open('main_site/resources/SocketServer.json', 'r')
    fJson = fJ.read()
    for i in range(size):
        newSpecif = specifications.objects.create(name_specification='spec' + random.choice(string.ascii_letters) +
                                                                     random.choice(string.ascii_letters),
                                                  author=User.objects.first(), date=date.today(),
                                                  version=random.choice([1.0, 2.0, 1.2, 1.1]),
                                                  description="description",
                                                  text_specification=fRead,
                                                  json_text=fJson)
        add_tags_to(newSpecif, [random.choice(tags)])
        f.close()
        fJ.close()


class BaseView(ListView):
    global buffer
    model = specifications
    template_name = "index.html"
    sizePaginator = 20
    queryset = specifications.objects.all().order_by('-date')
    if buffer is None:
        buffer = queryset

    def post(self, request, *args, **kwargs):
        global buffer
        sort_filter = SortForm(request.POST)
        form_filter = SpecifForm(request.POST)
        isSortValid = sort_filter.is_valid()
        if form_filter.is_valid() and sort_filter.cleaned_data["id_zero"] is None:
            buffer = filter_spec(self.queryset, form_filter)

        elif isSortValid and sort_filter.cleaned_data["id_zero"] is not None:
            self.defineSortingType(sort_filter.cleaned_data["id_zero"])

        paginator = Paginator(buffer, self.sizePaginator)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        return render(request, 'index.html', {'object_list': page_obj})

    def get(self, request, **kwargs):
        global buffer
        if len(request.GET) == 0:
            buffer = self.queryset
        page = request.GET.get('page', 1)
        paginator = Paginator(buffer, self.sizePaginator)
        try:
            users = paginator.page(page)
        except PageNotAnInteger:
            users = paginator.page(1)
        except EmptyPage:
            users = paginator.page(paginator.num_pages)
        return render(request, 'index.html', {'object_list': users})

    @staticmethod
    def defineSortingType(column: int):
        global buffer
        global SortColums
        tables = {0: 'name_specification', 1: 'date', 2: 'author', 3: 'version', 4: 'tags'}
        if SortColums == 'asc':
            buffer = buffer.order_by(tables[column])
            SortColums = 'desc'
        else:
            buffer = buffer.order_by("-" + tables[column])
            SortColums = 'asc'

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
        regform = RegisterForm()  # ???????????????? ?????????????? ?????????? ?????? ?????????? ???????????? ???????????? ????????????????????????
        assert isinstance(request, HttpRequest)
    return render(request, 'registration/registration.html',
                  {
                      'regform': regform,  # ???????????????? ?????????? ?? ???????????? ??????-????????????????
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
