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

function render_summary(entries) {
    var $out = $("#player_summary");

    // empty the list
    $out.children().remove();

    // now build it.

    /*
     * We are interested in:
     *  total kills
     *  unknown kills
     *  known kills
     *  number killed once
     *  number killed > 1
     *  kill with highest count
     */

    // First, the total number of kills
    var total_kills = 0;
    var unknown_kills = 0;
    var known_kills = 0;

    var killed_once = 0;
    var killed_multiple = 0;
    var killed_most = "";
    var killed_max = 0;

    $.each(entries, function(name, kills) {
        if(name.indexOf("#") !== 0) return;
        total_kills += kills;

        if(kills == 1) {
            killed_once++;
        } else {
            killed_multiple++;
        }

        if(killed_max < kills) {
            killed_max = kills;
            killed_most = name;
        }
    });

    if(killed_max) {
        killed_most = killed_most.substring(1);
    }

    unknown_kills = entries['#Unknown'] || 0;
    known_kills = total_kills - unknown_kills;

    var data = [];
    data.push("You killed a total of " + total_kills + " players.");
    data.push(unknown_kills + " were unknown.");
    data.push(known_kills + " were known.");
    data.push(killed_once + " were killed once.");
    data.push(killed_multiple + " were killed multiple times.");
    data.push("<strong>You killed " + killed_most + " the most (" + killed_max + " times!)</strong>");

    $out.append("<li>" + data.join("</li><li>") + "</li>");

}
