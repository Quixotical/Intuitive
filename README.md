# Feature Creation Application
This application is a demo app for JWT auth, social login, and feature/tracking creation

# Technologies
Python Flask </br>
MySQL </br>
Docker </br>
Knockout JS </br>

Below I will go through the steps required to build and run this application. If at any point along the way you run into an issue, please feel free to email me at jake@pomeloproductions.com

*NOTE*

-if you find yourself unable to run any commands along the way, verify if you need to be using the sudo command or not.

-if you receive the error "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?" it is likely that docker is *not* running. To fix this, (on Mac) open up spotlight search and search for "docker" open it and log in if necessary. On windows navigate to the .exe which will start Docker and then run it.


# SETUP
once you have cloned the repository onto your machine, please do the following to build the app/have it run on your machine.

Verify you have docker and docker-compose installed. 

`$ docker -v`

-the above command should provide output like: Docker version 17.09.0-ce, build afdb6d4

`$ docker-compose -v`

-the above command should provide output like: docker-compose version 1.16.1, build 6d1ac21

if you do not receive messages like this and instead receive something like:

`-bash: <the command you ran>: command not found`

it means you'll need to install the plugins.

docker can be found here:

https://docs.docker.com/engine/installation/

docker-compose can be found here:

https://docs.docker.com/compose/install/

Once you've got docker & docker-compose installed, `cd` into the directory you cloned this project into, then `cd` into the /src directory.

run this command in the terminal inside of the src directory:

`docker-compose build && docker-compose up`

once this process completes, open your web browser and navigate to:

http://localhost

That's it!
