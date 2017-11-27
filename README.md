# Feature Creation Application
This application is a demo app for JWT auth, social login, and feature/tracking creation

# Technologies
Python Flask </br>
MySQL </br>
Docker </br>
Knockout JS </br>

Below I will go through the steps required to build and run this application. If at any point along the way you run into an issue, please feel free to email me at jake@pomeloproductions.com

*NOTE* if you find yourself unable to run any commands along the way, verify if you need to be using the sudo command or not.

# SETUP
once you have cloned the repository onto your machine, please do the following to build the app/have it run on your machine.

Verify you have docker and docker-compose installed. 
$ docker -v
-provides output like: Docker version 17.09.0-ce, build afdb6d4
$ docker-compose -v
-provides output like: docker-compose version 1.16.1, build 6d1ac21

if you do not receive messages like this and instead receive something like:
$ you_didnt_install_it_yet -v
-bash: you_didnt_install_it_yet: command not found

it means you'll need to install the plugins.
docker can be found here:
https://docs.docker.com/engine/installation/

docker-compose can be found here:
https://docs.docker.com/compose/install/

go into the directory you cloned this project into, then cd into the /src directory.

run this command in the terminal inside of the src directory:
docker-compose build && docker-compose up

once this process completes, open your web browser and navigate to:
http://localhost

That's it!
