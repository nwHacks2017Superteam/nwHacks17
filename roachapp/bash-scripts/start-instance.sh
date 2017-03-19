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

cockroach start --background --port=0 --http-port=0 --store=node$RANDOM --join=localhost:$masterInstancePort 

