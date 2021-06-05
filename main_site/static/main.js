function sortTable(n, list) {
    console.log(n)
    var jsonParse = JSON.parse(list);
    var names = []
    if (n === 0) {
        for (let i = 0; i < jsonParse.length; i++) {
            names.push(jsonParse[i]['fields']['name_specification'])
        }
        names.sort()
        console.log(names)
    }


    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("myTable");
    switching = true;
    dir = "asc";
    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");
        console.log(rows.length)
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            console.log(x)
            console.log(y)
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    if (n === 0) {
                        for (let i = 0; i < jsonParse.length; i++) {
                            names.push(jsonParse[i]['fields']['name_specification'])
                        }
                        names.sort()
                        console.log(names)
                    }
                    //if so, mark as a switch and break the loop:
                    console.log('ASC')
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    //if so, mark as a switch and break the loop:
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}