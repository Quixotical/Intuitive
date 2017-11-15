def make_jsonifiable(model, data=[]):
    if data is None:
        return None

    keys = [column.key for column in model.__table__.columns]
    json_data = []
    try:
        for row in data:
            json_row = {}
            for key in keys:
                json_row.update({key : getattr(row,key)})

            json_data.append(json_row)
        return json_data
    except TypeError:
        #not iterable
        json_row = {}
        for key in keys:
            json_row.update({key: getattr(data, key)})
        json_data.append(json_row)
        return json_data

    return [{
        'error': 'Something went wrong parsing data model'
    }]

def update_model(table, row, request):
    keys = [column.key for column in table.__table__.columns]

    for key in keys:
        try:
            setattr(row, key, request.json[key])
        except KeyError:
            print('key error')

    return row
