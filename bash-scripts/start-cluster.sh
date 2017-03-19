#!/bin/bash

# Starts up a cockroach cluster

NUM_SERVERS='' # The number of instances to create in the cluster

# Flags
# "-n" the number of instances to create in the cluster

# Get Flags 
while getopts 'n:' flag; do
    case "${flag}" in
        n) NUM_SERVERS="${flag}" ;;
        *) error "Unexpected option ${flag}" ;;
    esac
done

if [ "$NUM_SERVERS" == "" ]; then
    echo "ERROR: Must provide number of instances via the \"-n\" option"
    exit 1
fi

# Start an instance, if given an address it will join to that address
function startInstance()
{
    if [ -z "$1" ]; then 
        cockroach start --background --port=0 --http-port=0 --store=node$RANDOM
    else
        cockroach start --background --port=0 --http-port=0 --store=node$RANDOM --join=$masterInstanceAddress 
    fi
}

# Start a main db instance and save the ip it's running on
test=$(startInstance)
#echo $test
#[[ $test =~ 'root@([[:alnum:]]*)' ]]
##MAIN_INSTANCE_IP=$(./start-instance | sed)
#
#echo $MAIN_INSTANCE_IP


