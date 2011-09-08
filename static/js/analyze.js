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

    // Start by building a list of lists for all entries in the trophy.
    var entries = [];

    // We use the name map so we can index the list efficiently on duplicate
    // entries. Useful for combining trophies
    var name_map = {};

    var lines = trophy.split("\n");

    var rx = /^\s+(\d+), (#?[a-z',\-\.\s]+?)(?:\s+(\d+), (#?[a-z',\.\-\s]+?))?$/i;

    function add_entry(name, kills) {

        var idx = name_map[name];

        // if the name is uknown, force the idx to -1
        if(name == '#Unknown') idx = -1;

        if(idx >= 0) {
            entries[idx][1] += kills;
        } else {
            entries.push([name, kills]);
            name_map[name] = entries.length - 1;
        }

    }

    $.each(lines, function(i, line) {
        var matches = line.match(rx);
        if(!matches) return;

        add_entry(matches[2], parseInt(matches[1], 10));
        if(matches[4]) {
            add_entry(matches[4], parseInt(matches[3], 10));
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

    $.each(entries, function(i, entry) {
        var name = entry[0];
        var kills = entry[1];

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

    // Kill count totals
    var total_kills = 0;
    var unknown_kills = 0;
    var known_kills = 0;

    // Player kill counts
    var players_killed = 0;
    var unknown_players = 0;
    var known_players = 0;

    var killed_once = 0;
    var killed_multiple = 0;

    // Track all known player kills in an array, indexed
    // by kill count to use as a leaderboard.
    var leaderboard = [];

    // we track the max unknown kill differently
    var unk_killed_max = 0;

    $.each(entries, function(i, entry) {
        var name = entry[0];
        var kills = entry[1];

        if(name.indexOf("#") !== 0) return;

        players_killed++;
        total_kills += kills;

        if(name == '#Unknown') {
            unk_killed_max = Math.max(unk_killed_max, kills);
            unknown_players++;
            unknown_kills += kills;
        } else {
            known_players++;
            known_kills += kills;
        }

        if(kills == 1) {
            killed_once++;
        } else {
            killed_multiple++;
        }

        if(name != '#Unknown') {
            if(leaderboard[kills]) {
                leaderboard[kills].push(name);
            } else {
                leaderboard[kills] = [name];
            }
        }
    });

    var data = [];
    data.push("You killed a total of " + players_killed + " players " + total_kills + " times.");
    data.push(unknown_players + " unknown players were killed " + unknown_kills + " times.");
    data.push(known_players + " known players were killed " + known_kills + " times.");
    data.push(killed_once + " were killed once.");
    data.push(killed_multiple + " were killed multiple times.");
    data.push("The highest number of unknown kills is " + unk_killed_max + ".");

    // build out the runner ups by iterating over the leaderboard in reverse
    var names;
    var j = 0;
    var runner_ups = [];
    for(var i = leaderboard.length-1; i >= 0; i--) {
        kills = i;
        names = leaderboard[kills];
        if(!names) continue;

        // convert the list of names to remove the pound signs
        var names_clean = [];
        $.each(names, function(i, name) {
            names_clean.push(name.substring(1));
        });

        // this is the highest number of kills
        if(j == 0) {
            data.push("<strong>You killed " + names_clean.join(", ") + " the most (" + kills + " times!)</strong>");
        } else if(j <= 4) {
            // we want to build the list of runner ups until we hit j == 4
            // but not if it's only 1 kill
            if(kills > 1) {
                runner_ups.push(names_clean.join(", ") + " " + kills + " times");
            }
        }

        j++;
    }

    data.push("Followed by " + runner_ups.join("; ") + ".");

    $out.append("<li>" + data.join("</li><li>") + "</li>");

}
