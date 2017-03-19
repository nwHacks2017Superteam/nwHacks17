#!/bin/bash

# Starts up a cockroach instance

masterInstanceAddress='' # The address of the master instance to connect to

# Flags
# "-m" the address of an instance in the cluster you want to join

# Get Flags 
while getopts 'm:' flag; do
    case "${flag}" in
        m) masterInstanceAddress="${OPTARG}" ;;
        *) error "Unexpected option ${flag}" ;;
    esac
done

if [ -z "$masterInstanceAddress" ]; then 
    cockroach start --background --port=0 --http-port=0 --store=node$RANDOM
else
    cockroach start --background --port=0 --http-port=0 --store=node$RANDOM --join=$masterInstanceAddress 
fi

