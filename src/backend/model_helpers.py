def make_jsonifiable(model, data=[]):
    if data is None:
        return None

    keys = [column.key for column in model.__table__.columns if column.key is not 'password']
    json_data = []
    try:
        for row in data:
            json_row = {}
            for key in keys:
                if key is not 'password':
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

def format_features(FeatureRequest, features):
    formatted_features = []

    for feature in features:

        feature.target_date = str(feature.target_date)
        formatted_feature = make_jsonifiable(FeatureRequest, feature)

        user = feature.user_features
        if user is not None:
            formatted_feature[0]['user_name'] = feature.user_features.fullname
        else:
            formatted_feature[0]['user_name'] = 'N/A'

        client = feature.client_features
        if client is not None:
            formatted_feature[0]['client_name'] = feature.client_features.name
        else:
            formatted_feature[0]['client_name'] = 'N/A'

        product = feature.product_features
        if product is not None:
            formatted_feature[0]['product_name'] = feature.product_features.name
        else:
            formatted_feature[0]['product_name'] = 'N/A'

        formatted_features.append(formatted_feature[0])

    return formatted_features
