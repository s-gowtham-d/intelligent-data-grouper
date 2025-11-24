import fs from "fs";
import csv from "csv-parser";

export function mergeGroups(rows) {
    const groups = {};

    for (const row of rows) {
        const name = row.group_name.trim();

        const ids = row.members_id.split(",").map(v => v.trim());
        const names = row.members_name.split(",").map(v => v.trim());

        if (!groups[name]) {
            groups[name] = {
                group_id: row.group_id,
                group_name: name,
                members_id: new Set(),
                members_name: new Set()
            };
        }

        ids.forEach(id => groups[name].members_id.add(id));
        names.forEach(n => groups[name].members_name.add(n));
    }

    return Object.values(groups).map(g => ({
        group_id: g.group_id,
        group_name: g.group_name,
        members_id: [...g.members_id],
        members_name: [...g.members_name]
    }));
}
