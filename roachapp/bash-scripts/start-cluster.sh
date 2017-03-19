#!/bin/bash

# Starts up a cockroach cluster

NUM_SERVERS=-1  # The number of instances to create in the cluster
UUID=""         # A unique id used to create the log file folder

# Flags
# "-n" the number of instances to create in the cluster

# Get Flags 
while getopts 'n:u:' flag; do
    case "${flag}" in
        n) NUM_SERVERS="${OPTARG}" ;;
        u) UUID="${OPTARG}" ;;
        *) error "Unexpected option ${flag}" ;;
    esac
done

if [ $NUM_SERVERS == -1 ]; then
    echo "ERROR: Must provide number of instances via the \"-n\" option"
    exit 1
fi
# if [ "$UUID" == "" ]; then
#     echo "ERROR: Must provide a uuid via the \"-u\" option"
#     exit 1
# fi

function getFreePort ()
{
    netstat -tln | awk 'NR > 2{gsub(/.*:/,"",$4); print $4}' | sort -un | awk -v n=$1 '$0 < n {next}; $0 == n {n++; next}; {exit}; END {print n}'
}

# Change to /tmp so we dont clutter up the project directory
cd /tmp

# Start the main db instance and save the port it's running on
mainPort=$(getFreePort 12000)
httpPort=$(getFreePort $(($mainPort+1)))
cockroach start --background --port=$mainPort --http-port=$httpPort --store=node$RANDOM > /dev/null
if [[ "$OSTYPE" == 'linux-gnu' ]]; then
    echo "$(ps -fC "cockroach" | tail -1 | awk '{print $2}'),$mainPort,$httpPort"
else
    echo "$(ps aux -O started | grep "cockroach" | grep "node$nodeNum" | awk '{print $2}'),$mainPort,$httpPort"
fi

# Start up however many db instances we asked for
# and echo the pid of each one
nodeNums=()
for i in `eval echo {0..$NUM_SERVERS}`
do
    # Choose a random node id
    nodeNum=$RANDOM
    # Save the node id to the list of id's
    nodeNums+=($nodeNum)
    # Run up an instance with the given node id
    cockroach start --background --port=0 --http-port=0 --store=node$nodeNum --join=localhost:$mainPort > /dev/null &
    # Echo the pid of the just created process
    #echo $(ps -fC cockroach | tail -1 | awk '{print $2}')
done

# Wait for the node instances to run up
sleep 4

# Get the process id's of the nodes we just created
for nodeNum in "${nodeNums[@]}";
do
    if [[ "$OSTYPE" == 'linux-gnu' ]]; then
        echo $(ps -fC "cockroach" | grep "node$nodeNum" | awk '{print $2}')
    else
        echo $(ps aux -O started | grep "cockroach" | grep "node$nodeNum" | awk '{print $2}')
    fi
done
