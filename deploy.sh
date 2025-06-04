user=root

while getopts ":u:" option; do
   case $option in
      u) # Enter a user
         user=$OPTARG;;
     \?) # Invalid option
         echo "Error: Invalid option"
         exit;;
   esac
done

if [[ $1 == "frontend" ]]; then
  ssh $user@159.65.213.14 "cd ~/projects/myFend/frontend; git pull; cd ~/projects/myFend; docker-compose up -d --build frontend"
elif [[ $1 == "backend" ]]; then
  ssh $user@159.65.213.14 "cd ~/projects/myFend; git pull; docker-compose up -d --build backend"
else
  ssh $user@159.65.213.14 "cd ~/projects/myFend/frontend; git pull; cd ~/projects/myFend; git pull; docker-compose up -d --build"
fi