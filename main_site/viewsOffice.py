import os
import subprocess
from datetime import date

from django.core.files.storage import FileSystemStorage
from django.http import HttpResponseRedirect
from django.shortcuts import render

from main_site.forms import addSpecifications
from main_site.models import specifications, tags_list


def viewAcc(request):
    spec = specifications.objects.order_by('-date').filter(author=request.user)
    return render(request, 'account.html', {'list': spec})


def addSpecification(request):
    templateForm = addSpecifications()
    if request.method == "POST" and 'fileSpec' in request.FILES.keys():
        fileSpec = request.FILES['fileSpec']
        fs = FileSystemStorage(location="main_site/resources")
        filename = fs.save(fileSpec.name, fileSpec)
        form = addSpecifications(request.POST)
        if form.is_valid():
            file = path_to_file(filename)
            f = open(file)
            error = check_spec(filename, form)
            if error:
                f.close()
                os.remove(file)
                return error_output(request, error, templateForm)
            command = 'java -jar main_site/resources/ParserToJSON.jar main_site/resources/{0}'.format(filename)
            for output_line in run_command(command):
                if output_line != "":
                    f.close()
                    os.remove(file)
                    return error_output(request, 'Your code is incorrect, check it!', templateForm)
            fileToJSON = str(filename).replace(".lsl", ".json")
            file_json = path_to_file(fileToJSON)
            fJ = open(file_json)
            newSpecif = specifications.objects.create(name_specification=form.name,
                                                      author=request.user, date=date.today(),
                                                      version=form.getversion, description=form.getdescription,
                                                      text_specification=f.read(), json_text=fJ.read())

            add_tags_to(newSpecif, form.gettags)
            f.close()
            fJ.close()
            os.remove(file)
            os.remove(file_json)

            return HttpResponseRedirect('http://127.0.0.1:8000/private_office/')

    return render(request, 'addSpecification.html', {'addform': templateForm})


def check_spec(filename: str, form) -> str:
    if not check_format(filename):
        return 'The file must be in the ".lsl" format!'
    if not check_repeat_name(form.name):
        return 'Such a library already exists!'
    if not check_version(form.getversion):
        return 'Use only numbers in the "Version" field!'
    if not check_tags(form.gettags):
        return
    return ''


def check_version(ver: str):
    if ver.isdigit():
        return True
    else:
        try:
            float(ver)
            return True
        except ValueError:
            return False


def check_tags(tags: list):
    for tag in tags:
        if len(tag) >= 30:
            return False
    return len(tags) <= 3


def add_tags_to(specific, tags):
    for tag in tags:
        try:
            existTag = tags_list.objects.filter(name=tag).get()
        except Exception as e:
            existTag = tags_list.objects.create(name=tag)
        existTag.specifications_set.add(specific)


def check_format(name):
    return name[-4:] == ".lsl"


def check_repeat_name(name):
    spec = specifications.objects.order_by('-date')
    try:
        spec.filter(name_specification=name).get()
        return False
    except:
        return True


def run_command(command):
    p = subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT)
    return iter(p.stdout.readline, b'')


def error_output(request, line, form):
    return render(request, 'addSpecification.html', {'list': line,
                                                     'addform': form})


def path_to_file(filename):
    pathFile = os.path.join(os.path.abspath(os.path.dirname(__file__)))
    pathFile += "/resources/{0}".format(filename)
    return pathFile


def remove_specification(request, pk):
    if request.method == "GET":
        specifications.objects.filter(pk=pk).delete()
    return HttpResponseRedirect('http://127.0.0.1:8000/private_office/')
