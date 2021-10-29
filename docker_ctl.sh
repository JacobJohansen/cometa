#!/bin/bash
# -
# changelog
# 2018.04.04. RRO Created docker_ctl.sh
# -

logger "${0} ${1} ${2}"
# -------
OLD_DIR=`pwd`
ENV='DEV'
export NODES=3 VIDEO=false HUB=1
# -------



case "$1" in 
	build)
		# =================================================
		# PLEASE USE DOCKER-COMPOSE FOR BUILDING THE IMAGES
		# =================================================

		# get the basics done
		docker-compose up -d
		
		# build test_grid
		#docker-compose -f docker/build/testing/docker-compose.yml -p grid up --force-recreate
 		docker-compose -f docker/build/testing/docker-compose.yml -p grid scale mock=1 hub=${HUB} chrome=${NODES} firefox=${NODES}

		# build install behave docker requirements
		logger "building"
		# docker exec -it cometa_behave pip install -r /code/docker/build/behave/requirements.txt FIXME
		docker exec -it cometa_behave apt-get update
		docker exec -it cometa_behave apt-get install apt-utils -yqq
		docker exec -it cometa_behave apt-get install build-essential checkinstall -y 
		docker exec -it cometa_behave apt-get upgrade -y 
		docker exec -it cometa_behave apt-get install ImageMagick python3-wand cron -y
		docker exec -it cometa_behave apt-get clean 
		docker exec -it cometa_behave apt-get autoremove 
		docker exec -it cometa_behave useradd -d /opt/code -g users node
		# docker exec -it cometa_django pip install -r /code/docker/DEV/requirements.txt

		# finally migrate some django migrations
		logger "* Migrating "
		./src/django_migrate.sh
		;;

	enter)
		[ -z "$2" ] && echo "Usage $0 enter <dockername: cometa_nginx, cometa_postgres, cometa_django>" && docker ps && exit 1
		docker exec -it $2 /bin/bash
		logger "exit $2"
		;;

	start)
		docker network connect grid_default cometa_behave
		docker network connect cometa_default zalenium
		docker-compose up -d
		docker-compose -f docker/build/testing/docker-compose.yml -p grid scale mock=1 hub=${HUB} chrome=${NODES} firefox=${NODES}
		./src/django_migrate.sh
		docker ps
		;;

	status)
		case "$2" in
		network)
			echo "==> docker ip adresses"
			docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}} {{.Name}}' $(docker ps -aq)
			echo "==> docker network ls"
			docker network ls --format "{{.ID}}:@@{{.Name}}@@{{.Driver}}@@{{.Scope}}@@{{.CreatedAt}}@@{{.Internal}}@@{{.Labels}}" | sed -r s'/@@/\t/g' | awk '{ printf "%-12.12s %-20.20s %-10.10s %-10.10s %-10.10s %-8.8s %-10.10s %-40s \n", $1,$2,$3,$4,$5,$6,$9,$10}'
			echo "==> docker network inspect bridge"
			docker network inspect bridge
			;;
		*)
			echo "==> docker ps --filter status=running"
			docker ps --filter status=running
			echo "==> docker ps --filter status=paused"
			docker ps --filter status=paused
			echo "==> docker -a --filter 'exited=137"
			docker ps -a --filter 'exited=137'
			echo "==> docker images"
			docker images | head -n 1 && docker images | tail -n +2 | sort
			echo "==> docker ip adresses"
			docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}} {{.Name}}' $(docker ps -aq)
			echo "-"
			echo "run ./docker_ctl.sh status network -> to show information about the network"
			echo "-"
			;;
		esac
		;;

	stop)
		docker stop $(docker ps --format "{{.Names}}" --filter "name=grid*" | tail -n +2)
		docker stop $(docker ps --format "{{.Names}}" --filter "name=testing*" | tail -n +2)
		docker-compose kill
		docker-compose ps
		;;

	remove)
		docker stop $(docker ps --format "{{.Names}}" --filter "name=grid*" | tail -n +2)
		docker stop $(docker ps --format "{{.Names}}" --filter "name=testing*" | tail -n +2)
		docker-compose kill
		docker-compose rm -f
		docker rm $(docker ps --format "{{.Names}}" --filter "name=grid*" | tail -n +2)
		docker rm $(docker ps --format "{{.Names}}" --filter "name=testing*" | tail -n +2)
		docker rm cometa_behave
		docker rm cometa_django
		docker rm cometa_postgres
		docker ps -a
		docker images
		;;

	reset)
		echo "resetting"
		./docker_ctl.sh stop
		docker rm cometa_behave
		./docker_ctl.sh build
		./docker_ctl.sh start
		;;



	*)
		echo "Usage: $0 {build|start|status|stop|remove|enter <dockername>}"
		exit 1
		;;
esac
