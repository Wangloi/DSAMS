import json
with open('scratch-locations.json') as f:
    data = json.load(f)
with open('compact-locations.txt', 'w') as f:
    for d in data:
        name = d['name'].replace("'", "\\'")
        f.write(f"    {{ id: '{d['id']}', name: '{name}', building: '{d['building']}', x: {d['x']}, y: {d['y']}, lat: {d['lat']}, lng: {d['lng']} }},\n")
