angular.module('reg')
  .controller('AdminUsersCtrl',[
    '$scope',
    '$state',
    '$stateParams',
    'UserService',
    function($scope, $state, $stateParams, UserService){

      $scope.pages = [];
      $scope.users = [];

      // Semantic-UI moves modal content into a dimmer at the top level.
      // While this is usually nice, it means that with our routing will generate
      // multiple modals if you change state. Kill the top level dimmer node on initial load
      // to prevent this.
      $('.ui.dimmer').remove();
      // Populate the size of the modal for when it appears, with an arbitrary user.
      $scope.selectedUser = {};
      $scope.selectedUser.sections = generateSections({status: '',
      confirmation: {
        dietaryRestrictions: []
      }, profile: {
        occupationalStatus: [],
        bestTools: [],
        previousJunction: []
      }, reimbursement: {
            dateOfBirth: [],
      }
      });

      console.log($scope.selectedUser.sections);

      function updatePage(data){
        $scope.users = data.users;
        $scope.currentPage = data.page;
        $scope.pageSize = data.size;

        var p = [];
        for (var i = 0; i < data.totalPages; i++){
          p.push(i);
        }
        $scope.pages = p;
      }

      UserService
        .getPage($stateParams.page, $stateParams.size, $stateParams.query)
        .success(function(data){
          updatePage(data);
        });

      $scope.$watch('queryText', function(queryText){
        UserService
          .getPage($stateParams.page, $stateParams.size, queryText)
          .success(function(data){
            updatePage(data);
          });
      });

      $scope.goToPage = function(page){
        $state.go('app.admin.users', {
          page: page,
          size: $stateParams.size || 50
        });
      };

      $scope.goUser = function($event, user){
        $event.stopPropagation();

        $state.go('app.admin.user', {
          id: user._id
        });
      };

      $scope.toggleCheckIn = function($event, user, index) {
        $event.stopPropagation();

        if (!user.status.checkedIn){
          swal({
            title: "Whoa, wait a minute!",
            text: "You are about to check in " + user.profile.name + "!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, check them in.",
            closeOnConfirm: false
            },
            function(){
              UserService
                .checkIn(user._id)
                .success(function(user){
                  $scope.users[index] = user;
                  swal("Accepted", user.profile.name + ' has been checked in.', "success");
                });
            }
          );
        } else {
          UserService
            .checkOut(user._id)
            .success(function(user){
              $scope.users[index] = user;
              swal("Accepted", user.profile.name + ' has been checked out.', "success");
            });
        }
      };

      $scope.toggleReject = function($event, user, index) {
        $event.stopPropagation();
        if (!user.status.rejected){
          swal({
            title: "Whoa, wait a minute!",
            text: "You are about to reject " + user.profile.name + "!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, reject.",
            closeOnConfirm: false
            },
            function(){
              UserService
                .reject(user._id)
                .success(function(user){
                  $scope.users[index] = user;
                  if(user !== "")
                    swal("Accepted", user.profile.name + ' has been rejected.', "success");
                  else
                    swal("Could not be rejected", 'User cannot be rejected if its not verified or it is admitted', "error");
                });
            }
          );
        } else {
          UserService
            .unReject(user._id)
            .success(function(user){
              if(index != "undefined")
                $scope.users[index] = user;
              swal("Accepted", user.profile.name + ' has been unrejected.', "success");
            });
        }
      };

      $scope.acceptUser = function($event, user, index) {
        $event.stopPropagation();

        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to accept " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, accept them.",
          closeOnConfirm: false
          }, function(){

            swal({
              title: "Are you sure?",
              text: "Your account will be logged as having accepted this user. " +
                "Remember, this power is a privilege.",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, accept this user.",
              closeOnConfirm: false
              }, function(){

                UserService
                  .admitUser(user._id)
                  .success(function(user){
                    if(index != "undefined")
                      $scope.users[index] = user;
                    swal("Accepted", user.profile.name + ' has been admitted.', "success");
                  });

              });

          });

      };

      function formatTime(time){
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      $scope.rowClass = function(user) {
        if (user.admin){
          return 'admin';
        }
        if (user.status.confirmed) {
          return 'positive';
        }
        if (user.status.admitted && !user.status.confirmed) {
          return 'warning';
        }
      };

      function selectUser(user){
        $scope.selectedUser = user;
        $scope.selectedUser.sections = generateSections(user);
        $('.long.user.modal')
          .modal('show');
      }

       $scope.exportCSV = function() {
        UserService
        .getAll()
        .success(function(data){

          var output = "";
          var titles = generateSections(data[0]);
           for(var i = 0; i < titles.length; i++){
            for(var j = 0; j < titles[i].fields.length; j++){
              output += titles[i].fields[j].name + ";";
            }
           }
           output += "\n";
           
          for (var rows = 0; rows < data.length; rows++){
            row = generateSections(data[rows]);
            for (var i = 0; i < row.length; i++){
              for(var j = 0; j < row[i].fields.length;j++){
                if(!row[i].fields[j].value){
                  output += ";";
                  continue;
                }
                output += row[i].fields[j].value + ";";
              }
            }
            output += "\n";
          }
          
          var element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
          element.setAttribute('download', "base.csv");
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
            
          });
      }
      function findUser(user){

      }
      function generateSections(user){
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Created On',
                value: formatTime(user.timestamp)
              },{
                name: 'Last Updated',
                value: formatTime(user.lastUpdated)
              },{
                name: 'Confirm By',
                value: formatTime(user.status.confirmBy) || 'N/A'
              },{
                name: 'Status',
                value: user.status.name
              },{
                name: 'Rejected',
                value: user.status.rejected
              },{
                name: 'Checked In',
                value: formatTime(user.status.checkInTime) || 'N/A'
              },{
                name: 'Name',
                value: user.profile.name
              },{
                name: 'Email',
                value: user.email
              },{
                name: 'ID',
                value: user.id
              },{
                name: 'Team',
                value: user.teamCode || 'None'
              }
            ]
          },{
            name: 'Profile',
            fields: [
              {
                name: 'Age',
                value: user.profile.age
              },{
                name: 'Gender',
                value: user.profile.gender
              },{
                name: 'Phone',
                value: user.confirmation.phone
              },{
                name: 'School',
                value: user.profile.school
              },{
                name: 'Travels from Country',
                value: user.profile.travelFromCountry
              },{
                name: 'Travels from City',
                value: user.profile.travelFromCity
              },{
                name: 'Home Country',
                value: user.profile.homeCountry
              },{
                name: 'Team role',
                value: user.profile.description
              },{
                name: 'Needs Travel Reimbursement',
                value: user.profile.needsReimbursement,
                type: 'boolean'
              },{
                name: 'Needs Accommodation',
                value: user.profile.applyAccommodation,
                type: 'boolean'
              },{
                name: 'Most interesting track',
                value: user.profile.mostInterestingTrack
              },{
                name: 'Occupational status',
                value: user.profile.occupationalStatus.join(', ')
              },{
                name: 'Best tools',
                value: user.profile.bestTools.join(', ')
              },{
                name: 'Coding experience',
                value: user.profile.codingExperience
              },{
                name: 'Hackathons visited',
                value: user.profile.howManyHackathons
              },{
                name: 'Motivation',
                value: user.profile.essay
              },
            ]
          },{
            name: 'Additional',
            fields: [
              {
                name: 'Portfolio',
                value: user.profile.portfolio
              },{
                name: 'Interest in job opportunities',
                value: user.profile.jobOpportunities
              },{
                name: 'Special Needs',
                value: user.profile.specialNeeds || 'None'
              },{
                name: 'Previous Junctions',
                value: user.profile.previousJunction.join(', ')
              },{
                name: 'Secret code',
                value: user.profile.secret
              },{
                name: 'Free comment',
                value: user.profile.freeComment
              },{
                name: 'OS',
                value: user.profile.operatingSystem
              },{
                name: 'Spaces or Tabs',
                value: user.profile.spacesOrTabs
              },
            ]
          },{
            name: 'Confirmation',
            fields: [
              {
                name: 'Dietary Restrictions',
                value: user.confirmation.dietaryRestrictions.join(', ')
              },{
                name: 'Shirt Size',
                value: user.confirmation.shirtSize
              },{
                name: 'Needs Hardware',
                value: user.confirmation.needsHardware,
                type: 'boolean'
              },{
                name: 'Hardware Requested',
                value: user.confirmation.hardware
              },{
                name: 'Additional notes',
                value: user.confirmation.notes
              }
            ]
          },{
            name: 'Reimbursement',
            fields: [
              {
                name: 'Date of birth',
                value: formatTime(user.reimbursement.dateOfBirth)
              },{
                name: 'AddressLine 1',
                value: user.reimbursement.addressLine1
              },{
                name: 'AddressLine 2',
                value: user.reimbursement.addressLine2
              },{
                name: 'State/Province/Region',
                value: user.reimbursement.stateProvinceRegion
              },{
                name: 'A country Of Bank',
                value: user.reimbursement.countryOfBank
              },{
                name: 'Name Of the Bank',
                value: user.reimbursement.nameOfBank
              },{
                name: 'Address Of the Bank',
                value: user.reimbursement.addressOfBank
              },{
                name: 'Iban',
                value: user.reimbursement.iban
              },{
                name: 'Account Number',
                value: user.reimbursement.accountNumber
              },{
                name: 'swiftOrBicOrClearingCode',
                value: user.reimbursement.swiftOrBicOrClearingCode
              },{
                name: 'Brokerage Info',
                value: user.reimbursement.brokerageInfo
              },{
                name: 'Additional',
                value: user.reimbursement.additional
              },
            ]
          },
        ];
      }

      $scope.selectUser = selectUser;

    }]);
