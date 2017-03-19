#!/bin/bash

# Starts up a cockroach cluster

NUM_SERVERS=-1 # The number of instances to create in the cluster

# Flags
# "-n" the number of instances to create in the cluster

# Get Flags 
while getopts 'n:' flag; do
    case "${flag}" in
        n) NUM_SERVERS="${OPTARG}" ;;
        *) error "Unexpected option ${flag}" ;;
    esac
done

if [ $NUM_SERVERS == -1 ]; then
    echo "ERROR: Must provide number of instances via the \"-n\" option"
    exit 1
fi

# # Start an instance, if given an port it will join to that port
# function startInstance()
# {
#     if [ -z "$1" ]; then 
#         cockroach start --background --port=0 --http-port=0 --store=node$RANDOM &> /dev/null
#     else
#         cockroach start --background --port=0 --http-port=0 --store=node$RANDOM --join=localhost:$1 &> /dev/null 
#     fi
# }

function getFreePort ()
{
    ss -tln | awk 'NR > 1{gsub(/.*:/,"",$4); print $4}' | sort -un | awk -v n=12000 '$0 < n {next}; $0 == n {n++; next}; {exit}; END {print n}'
}

# Start the main db instance and save the port it's running on
mainPort=$(getFreePort)
cockroach start --background --port=$mainPort --http-port=0 --store=node$RANDOM > /dev/null
echo $(ps -fC cockroach | tail -1 | awk '{print $2}')

# Start up however many db instances we asked for
# and echo the pid of each one
for i in `eval echo {0..$NUM_SERVERS}`
do
    cockroach start --background --port=0 --http-port=0 --store=node$RANDOM --join=localhost:$mainPort > /dev/null
    # Echo the pid of the just created process
    echo $(ps -fC cockroach | tail -1 | awk '{print $2}')
done

