#!/bin/bash

# Starts up a cockroach instance

masterInstancePort='' # The address of the master instance to connect to

# Get Flags 
while getopts 'p:' flag; do
    case "${flag}" in
        p) masterInstancePort="${OPTARG}" ;;
        *) error "Unexpected option ${flag}" ;;
    esac
done
if [ "$masterInstancePort" == "" ]; then
    echo "ERROR: must provide address of cluster to join via the \"-p\" flag"
    exit 1
fi

# Change to /tmp so we dont clutter up the project directory
cd /tmp

nodeNum=$RANDOM
cockroach start --background --port=0 --http-port=0 --store=node$nodeNum --join=localhost:$masterInstancePort > /dev/null 

echo $(ps -fC "cockroach" | grep "node$nodeNum" | awk '{print $2}')

