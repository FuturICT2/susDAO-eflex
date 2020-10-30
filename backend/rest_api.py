




from flask import Flask, request
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

class TodoSimple(Resource):
    def get(self):
        return {"hello": "wossrld"}

api.add_resource(TodoSimple, '/')

if __name__ == '__main__':
    app.run(debug=True)