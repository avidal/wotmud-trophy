$(function() {
    $("#analyze_button").click(function(evt) {
        evt.preventDefault();
        var trophy = $("#trophy_input").val();
        analyze(trophy);
    });

    $("#output_table").tablesorter({
        sortList: [[0,1], [2,1]]
    });

});

var ENTRIES = {};

function analyze(trophy) {
    /*
     * Each (valid) line of the trophy consists of one or two entries
     * in the following format:
     *  (count), (name)
     * The first entry in the line is always preceded by start of line followed
     * by whitespace. The last entry is always followed by white space and EOL.
     *
     * If the name begins with a hash (#) then it is a PC.
     */

    // Start by building a hash of all entries in the trophy
    var entries = {};

    var lines = trophy.split("\n");

    var rx = /^\s+(\d+), (#?[a-z',\-\.\s]+?)(?:\s+(\d+), (#?[a-z',\.\-\s]+?))$/i;

    $.each(lines, function(i, line) {
        var matches = line.match(rx);
        if(!matches) return;

        entries[matches[2]] = parseInt(matches[1], 10);
        if(matches[4]) {
            entries[matches[4]] = parseInt(matches[3], 10);
        }
    });

    render_output(entries);
    render_summary(entries);

}

function render_output(entries) {
    var $out = $("#output_table");
    var $body = $out.find('tbody');

    // first, empty the output table
    $body.find('tr').remove();

    $.each(entries, function(name, kills) {
        var type_ = 'mob';

        if(name.indexOf('#') == 0) {
            type_ = 'player';
            name = name.substring(1); // remove the #
        }

        var data = [];
        data.push(type_);
        data.push(name);
        data.push(kills);

        var row = "<tr><td>" + data.join("</td><td>") + "</td></tr>";
        $body.append(row);
    });

    $out.trigger('update');

    window.setTimeout(function() {
        $out.trigger('sorton', [[[0,1], [2,1]]]);
    }, 500);
}
