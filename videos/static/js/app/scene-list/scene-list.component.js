// Register `phoneList` component, along with its associated controller and template
angular.module('sceneList').component('sceneList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: ['$element', '$attrs', function ($element, $attrs) {

        // if ($attrs.viewStyle == 'grid') {
        //     return 'static/js/app/scene-list/scene-list-grid.template.html'
        // } else {
        return 'static/js/app/scene-list/scene-list.template.html';
        // }


    }],
    bindings: {
        mainPage: '=',
        treeFolder: '='
    },
    controller: ['$scope', 'Scene', 'helperService', 'scopeWatchService', 'pagerService', 'Actor',
        'Website', 'SceneTag', '$http', '$rootScope', '$q', '$location',
        function SceneListController($scope, Scene, helperService, scopeWatchService, pagerService, Actor,
                                     Website, SceneTag, $http, $rootScope, $q ,$location) {

            var self = this;
            var actorLoaded = false;
            var sceneTagLoaded = false;
            var websiteLoaded = false;
            var folderLoaded = false;
            var didSectionListWrapperLoad = false;
            var didSectionListWrapperLoadIsMainPage = false;
            var playlistLoaded = false;

            self.gotPromise = false;
            self.working = false;
            $scope.gotPromiseSceneList = false;


            if (helperService.getNumberOfItemsPerPaige() != undefined) {
                self.itemsPerPage = helperService.getNumberOfItemsPerPaige()
            } else {
                self.itemsPerPage = 10
            }

            self.thumbWidth = 200;

            self.isSomethingLoaded = function () {


                return actorLoaded || sceneTagLoaded || websiteLoaded || folderLoaded || didSectionListWrapperLoadIsMainPage || playlistLoaded
            };


            self.sceneArray = [];
            self.sceneArray = [];

            self.scenesToAdd = [];

            self.pageType = 'Scene';

            self.selectedScenes = [];

            self.selectAllStatus = false;

            self.tagMultiple = false;

            self.multiTag = function () {

                if (self.tagMultiple) {
                    self.tagMultiple = false;
                } else {
                    self.tagMultiple = true;
                }

            };


            self.gridView = false;


            var checkGridOption = function () {
                if ((helperService.getGridView() != undefined) && (helperService.getGridView()['scene'] != undefined)) {
                    self.gridView = helperService.getGridView()['scene']
                }
            };

            checkGridOption();

            $scope.$on("gridViewOptionChnaged", function (event, pageInfo) {
                checkGridOption()
            });


            self.selectAll = function () {

                self.selectedScenes = [];
                for (var i = 0; i < self.scenes.length; i++) {
                    self.scenes[i].selected = true;
                    self.selectedScenes.push(self.scenes[i].id)
                }

            };


            self.selectNone = function () {

                for (var i = 0; i < self.scenes.length; i++) {
                    self.scenes[i].selected = false;
                }
                self.selectedScenes = [];

            };

            self.sceneSelectToggle = function (scene) {

                var found = false;

                for (var i = 0; i < self.selectedScenes.length; i++) {
                    if (scene.id == self.selectedScenes[i]) {
                        found = true;
                    }

                }

                if (!found) {
                    self.selectedScenes.push(scene.id)

                }

                if (found) {
                    self.selectedScenes.splice(self.selectedScenes.indexOf(scene.id), 1)
                }

                // alert(angular.toJson(self.selectedScenes))

            };


            // $rootScope.$storage = $localStorage;

            self.sceneArraystore = function () {

                // helperService.set(self.sceneArray);
                var scArray = [];
                for (i = 0; i < self.scenes.length; i++) {
                    scArray.push(self.scenes[i].id)
                }

                helperService.set(scArray);
                // $rootScope.$storage.scArray = scArray;

                console.log(helperService.get());
                // self.sceneArray = [];
            };

            self.sceneArrayClear = function () {
                console.log("scene arrray cleared!");
                if (($rootScope.$storage != undefined) && ($rootScope.$storage.scArray != undefined)) {
                    delete $rootScope.$storage.scArray;
                }


            };

            var pageNumberForInfScroll = 0;

            self.infNextPage = function () {

                console.log("self.totalItems are " + self.totalItems);
                console.log("self.infiniteScenes are " + self.infiniteScenes.length);

                if (self.working) {
                    console.log("Inf scroll tried to load, but another call was already in progress...");
                    return;
                }

                if (self.itemsPerPage * pageNumberForInfScroll > self.totalItems) {
                    console.log("Reached the end of result query...");
                    return;
                }

                if (self.totalItems < self.infiniteScenes.length) {
                    console.log("Reached the end of result query...");
                    return;
                }

                if (!self.isSomethingLoaded()) {
                    console.log("Waiting for something to load...");
                    return;
                } else {
                    console.log("actorLoaded: "
                        + actorLoaded +
                        " sceneTagLoaded: " +
                        sceneTagLoaded +
                        " websiteLoaded: " +
                        websiteLoaded +
                        " folderLoaded: " +
                        folderLoaded +
                        " didSectionListWrapperLoadIsMainPage: " +
                        didSectionListWrapperLoadIsMainPage
                        + "playlistLoaded " +
                        playlistLoaded
                    )
                }

                self.working = true;

                if (self.infiniteScenes.length > 0 && pageNumberForInfScroll == 0) {
                    pageNumberForInfScroll = 1;
                }

                self.nextPage(pageNumberForInfScroll);
                pageNumberForInfScroll++;

            };

            self.nextPage = function (currentPage) {
                self.working = true;
                // self.sceneArrayClear();
                console.log("scene-list: nextPage function triggered!");

                var input = {
                    currentPage: currentPage,
                    pageType: self.pageType,
                    actor: self.actor,
                    sceneTag: self.sceneTag,
                    website: self.website,
                    folder: self.folder,
                    searchTerm: self.searchTerm,
                    searchField: self.searchField,
                    sortBy: self.sortBy,
                    isRunnerUp: self.runnerUp,
                    recursive: self.recursive,
                    playlist: self.playlist
                };


                self.actorsToadd = pagerService.getNextPage(input
                );


                self.actorsToadd.$promise.then(function (res) {

                    // self.actorsToadd = res[0];

                    var paginationInfo = {
                        pageType: input.pageType,
                        pageInfo: res[1]
                    };

                    // scopeWatchService.paginationInit(paginationInfo);

                    self.totalItems = parseInt(paginationInfo.pageInfo.replace(/.*<(\d+)>; rel="count".*/, '$1'));


                    self.scenes = helperService.resourceToArray(res[0]);

                    self.numberOfItemsReturned = self.scenes.length;
                    self.infiniteScenes = self.infiniteScenes.concat(self.scenes);

                    self.scenes = [];

                    self.sceneArraystore();


                    self.working = false


                });


            };


            // if (self.mainPage) {
            //     console.log("main page is true! + " + self.mainPage);
            //     self.nextPage(0);
            // }

            if (self.treeFolder != undefined) {
                self.folder = self.treeFolder;
                pageNumberForInfScroll = 0;
                self.nextPage(0);
            }

            $scope.$on("paginationChange", function (event, pageInfo) {
                if (pageInfo.pageType == self.pageType) {
                    self.nextPage(pageInfo.page)
                }


            });


            // This is necessery for now because sometimes  the "actorLoaded" event is fired before
            // this script is loaded so we miss it and don't load any scenes.
            // This workaround fire an event that checks if an actor was loaded if it was it then fire the
            // actorLoaded event that we can catch.


            $scope.$on("actorLoaded", function (event, actor) {

                self.actor = actor;
                self.nextPage(0);
                pageNumberForInfScroll = 0;


                actorLoaded = true;
            });

            if (!actorLoaded) {
                scopeWatchService.didActorLoad("a");
            }

            $scope.$on("playlistLoaded", function (event, playlist) {

                self.playlist = playlist;
                pageNumberForInfScroll = 0;
                self.nextPage(0);


                playlistLoaded = true;
            });

            if (!playlistLoaded) {
                scopeWatchService.didPlaylistLoad("a");
            }


            $scope.$on("sceneTagLoaded", function (event, sceneTag) {
                self.sceneTag = sceneTag;
                self.nextPage(0);
                pageNumberForInfScroll = 0;
                sceneTagLoaded = true;
            });

            if (!sceneTagLoaded) {
                scopeWatchService.didSceneTagLoad("a");
            }

            $scope.$on("websiteLoaded", function (event, website) {
                self.website = website;
                self.nextPage(0);
                pageNumberForInfScroll = 0;
                websiteLoaded = true
            });

            if (!websiteLoaded) {
                scopeWatchService.didWebsiteLoad('a');
            }


            $scope.$on("folderOpened", function (event, folder) {
                console.log("scene-list: folderOpened broadcast was caught");
                self.scenes = [];
                self.infiniteScenes = [];
                self.folder = folder['dir'];
                self.recursive = folder['recursive'];
                // alert(folder['recursive']);
                // self.scenes = [];
                self.nextPage(0);
                pageNumberForInfScroll = 0;
                folderLoaded = true;
            });

            if (!folderLoaded) {
                scopeWatchService.didFolderLoad('a');
            }

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'SceneList') {
                    console.log("Sort Order Changed!");
                    self.scenes = [];
                    self.infiniteScenes = [];
                    self.sortBy = sortOrder['sortBy'];

                    if (sortOrder.mainPage == undefined || sortOrder.mainPage == true) {

                        self.nextPage(0);
                        pageNumberForInfScroll = 0;
                        didSectionListWrapperLoadIsMainPage = true;

                    }
                    self.totalItems = 0;
                    // $scope.$emit('list:filtered');
                    didSectionListWrapperLoad = true;

                }

            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('SceneList')
            }


            var findIndexOfSceneInList = function (sceneToFind) {
                var found = false;
                var ans = null;
                if (typeof sceneToFind === 'object') {
                    for (var i = 0; i < self.scenes.length && !found; i++) {
                        if (sceneToFind.id == self.scenes[i].id) {
                            found = true;
                            ans = i
                        }
                    }
                } else {
                    for (var i = 0; i < self.scenes.length && !found; i++) {
                        if (sceneToFind == self.scenes[i].id) {
                            found = true;
                            ans = i
                        }
                    }
                }

                return ans;

            };


            self.updateScenesOnRemove = function (scenes, itemToRemove, typeOfItemToRemove) {

                if (typeOfItemToRemove == 'delete') {

                    for (var x = 0; x < scenes.length; x++) {
                        self.removeSceneFromList(scenes[x]);
                    }

                } else {


                    for (var j = 0; j < scenes.length; j++) {

                        var sceneIndex = findIndexOfSceneInList(scenes[j]);


                        self.scenes[sceneIndex] = $rootScope.removeItemFromScene(self.scenes[sceneIndex], itemToRemove, typeOfItemToRemove);


                    }


                }


            };

            self.removeSceneFromList = function (sceneToRemvoe) {

                var index_of_scene = -1;

                if (typeof sceneToRemvoe === 'object') {
                    index_of_scene = findIndexOfSceneInList(sceneToRemvoe.id);
                } else {
                    index_of_scene = findIndexOfSceneInList(sceneToRemvoe);
                }

                self.scenes.splice(index_of_scene, 1);

            };

            self.confirmRemove = function (originalScene, originalItemToRemove, originalTypeOfItemToRemove, originalPermDelete) {

                var message = "";

                if (originalPermDelete) {    //If delete from disk
                    message = "Are you really sure you want to delete the selected scene(s) from DISK?";
                } else {
                    message = "Are you sure you want to remove the selected scene(s) from the DB?";
                }
                if (confirm(message)) self.removeItem(originalScene, originalItemToRemove, originalTypeOfItemToRemove, originalPermDelete);

            };

            self.removeItem = function (scene, itemToRemove, typeOfItemToRemove, permDelete) {


                // var resId = [];

                var sceneIndex = findIndexOfSceneInList(scene.id);

                var itToRemove = [];
                itToRemove.push(itemToRemove.id);

                if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                    $rootScope.patchEntity('scene', self.scenes[sceneIndex].id, typeOfItemToRemove, itToRemove, 'remove', true, permDelete, self.selectedScenes);
                    self.updateScenesOnRemove(self.selectedScenes, itemToRemove, typeOfItemToRemove)
                } else {
                    $rootScope.patchEntity('scene', self.scenes[sceneIndex].id, typeOfItemToRemove, itToRemove, 'remove', false, permDelete, self.selectedScenes);
                    if (typeOfItemToRemove != 'delete') {
                        var scenes = [];
                        scenes.push(scene.id);
                        self.updateScenesOnRemove(scenes, itemToRemove, typeOfItemToRemove)
                    } else {
                        if (!permDelete) {
                            self.removeSceneFromList(scene)
                        }
                    }


                    self.selectNone()


                }
            }
            ;


            var updateSceneOnPageOnAdd = function (sceneIndex, typeOfItemToAdd, itemToAdd) {


                self.scenes[sceneIndex] = $rootScope.addItemToScene(self.scenes[sceneIndex], itemToAdd, typeOfItemToAdd);


            };

            var updateScenesOnPageOnAdd = function (itemToAdd, typeOfItemToAdd) {

                for (var i = 0; i < self.selectedScenes.length; i++) {

                    var sceneIndex = findIndexOfSceneInList(self.selectedScenes[i]);
                    updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd);


                }
            };

            var checkIfSceneSelected = function (scene) {
                var found = false;
                for (var i = 0; i < self.selectedScenes.length && !found; i++) {
                    if (scene.id == self.selectedScenes[i]) {
                        found = true;
                    }

                }

                return found

            };


            self.addItem = function (scene, itemToAdd, typeOfItemToAdd) {

                // Find the scene in question in self.scenes
                var sceneIndex = findIndexOfSceneInList(scene.id);

                // if the type of item to add does not exist in the scene (EX: The websites array does not exist)
                // create empty one.


                // id '-1' signifies that the item in question does not exist in the database yet and needs to be
                // created.
                if (itemToAdd.id != '-1') {

                    var patchData = [];
                    patchData.push(itemToAdd.id);

                    // If more than one scene is checked and if current scene is one of the checked scenes.
                    if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {

                        updateScenesOnPageOnAdd(itemToAdd, typeOfItemToAdd);

                        $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', true, false, self.selectedScenes);
                    } else {
                        updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd);

                        //
                        // for (var i = 0; i < self.scenes[sceneIndex][typeOfItemToAdd].length; i++) {
                        //     patchData.push(self.scenes[sceneIndex][typeOfItemToAdd][i].id);
                        // }

                        $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', false, false, self.selectedScenes)


                    }


                } else {

                    var newItem = $rootScope.createNewItem(typeOfItemToAdd, itemToAdd.value);
                    // if (typeOfItemToAdd == 'actors') {
                    //     newItem = new Actor();
                    //     newItem.thumbnail = 'media/images/actor/Unknown/profile/profile.jpg'; //need to change this to a constant!
                    //     newItem.scenes = [];
                    // } else if (typeOfItemToAdd == 'scene_tags') {
                    //     newItem = new SceneTag();
                    //     newItem.scenes = [];
                    //     newItem.websites = [];
                    // } else if (typeOfItemToAdd == 'websites') {
                    //     newItem = new Website;
                    //     newItem.scenes = [];
                    // }
                    //
                    // newItem.name = itemToAdd.value;

                    newItem.$save().then(function (res) {

                        // Duplicate code from  [if (itemToAdd.id != '-1')] need to clean up.
                        var patchData = [];
                        patchData.push(res.id);

                        if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                            updateScenesOnPageOnAdd(res, typeOfItemToAdd);


                            $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', true, false, self.selectedScenes)
                        } else {
                            updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, res);

                            $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', false, false, self.selectedScenes)
                        }


                    })
                }


            };

            self.patchScene = function (sceneToPatchId, patchType, patchData, addOrRemove, multiple, permDelete) {

                var type = {};
                type[patchType] = patchData;

                var itemsToUpdate = [];
                if (multiple) {
                    itemsToUpdate = self.selectedScenes
                } else {
                    itemsToUpdate.push(sceneToPatchId)
                }


                // if (multiple) {

                $http.post('tag-multiple-items/', {
                    params: {
                        type: 'scene',
                        patchType: patchType,
                        patchData: patchData,
                        itemsToUpdate: itemsToUpdate,
                        addOrRemove: addOrRemove,
                        permDelete: permDelete
                    }
                }).then(function (response) {
                    console.log("Update finished successfully")
                }, function errorCallback(response) {
                    alert("Something went wrong!");
                });
            };

            // $scope.$on("sceneTagSelected", function (event, object) {
            //
            // };

            $scope.$on("actorSelected", function (event, object) {

                var selectedObject = object['selectedObject'];
                var originalObject = object['originalObject'];

                self.addItem(originalObject, selectedObject, 'actors');

            });


            $scope.$on("sceneTagSelected", function (event, object) {

                if (object['sendingObjectType'] == 'Scene-List') {
                    var selectedObject = object['selectedObject'];
                    var originalObject = object['originalObject'];

                    self.addItem(originalObject, selectedObject, 'scene_tags');
                }


            });

            $scope.$on("websiteSelected", function (event, object) {

                var selectedWebsite = object['selectedObject'];
                var scene = object['originalObject'];


                self.addItem(scene, selectedWebsite, 'websites');


            });

            $scope.$on("playlistSelected", function (event, object) {

                var selectedPlaylist = object['selectedObject'];
                var scene = object['originalObject'];


                self.addItem(scene, selectedPlaylist, 'playlists');


            });


            $scope.$on("searchTermChanged", function (event, searchTerm) {

                if (searchTerm['sectionType'] == 'SceneList') {
                    self.scenes = [];
                    self.infiniteScenes = [];
                    self.searchTerm = searchTerm['searchTerm'];
                    self.searchField = searchTerm['searchField'];
                    self.nextPage(0);
                    pageNumberForInfScroll = 0;
                    self.totalItems = 0;
                    // $scope.$emit('list:filtered');
                }

            });


            $scope.$on("runnerUpChanged", function (event, runnerUp) {
                if (runnerUp['sectionType'] == 'SceneList') {
                    console.log("Sort Order Changed!");
                    self.scenes = [];
                    self.infiniteScenes = [];
                    self.runnerUp = runnerUp['runnerUp'];
                    self.nextPage(0);
                    pageNumberForInfScroll = 0;
                }

            });


            self.sceneRunnerUpToggle = function (scene) {

                $rootScope.patchEntity('scene', scene.id, 'is_runner_up', scene.is_runner_up, 'add', false, false, self.selectedScenes);


            };


            self.sceneRatingPatch = function (scene) {

                $rootScope.patchEntity('scene', scene.id, 'rating', scene.rating, 'add', false, false, self.selectedScenes);


            };


            self.sceneArrayPush = function (sceneId) {

                self.sceneArray.push(sceneId);
                // console.log("Scene-List: sceneArray is:" +  angular.toJson(self.sceneArray))
            };

            self.playScene = function (scene) {

                return $http.get('play-scene/', {
                    params: {
                        sceneId: scene.id
                    }
                })
            };

            self.playRandomScene = function () {
                var actorId = -6;
                var sceneTagId = -6;
                var websiteId = -6;
                var folderId = -6;
                var playlistId = -6;


                if (self.actor != undefined) {
                    actorId = self.actor.id
                }

                if (self.sceneTag != undefined) {
                    sceneTagId = self.sceneTag.id
                }

                if (self.website != undefined) {
                    websiteId = self.website.id
                }

                if (self.folder != undefined) {
                    folderId = self.folder.id
                }

                if (self.playlist != undefined) {
                    playlistId = self.playlist.id
                }


                return $http.get('play-scene/', {
                    params: {
                        actor: actorId,
                        sceneTag: sceneTagId,
                        website: websiteId,
                        folder: folderId,
                        playlist: playlistId
                    }
                })
            };


            self.deleteScene = function (sceneToRemove) {

                if (self.selectedScenes == [] || self.selectedScenes.indexOf(sceneToRemove.id) == -1) {
                    Scene.remove({sceneId: sceneToRemove.id});

                    var index_of_scene = findIndexOfSceneInList(sceneToRemove.id);
                    self.scenes.splice(index_of_scene, 1);
                }


            };

            self.removeSceneFromPlaylist = function (sceneToRemove) {
                var sceneIndex = findIndexOfSceneInList(sceneToRemove);
                var patchData = [];
                patchData.push(self.playlist.id);

                if (self.selectedScenes.length > 0 && checkIfSceneSelected(sceneToRemove)) {


                    $rootScope.patchEntity('scene', self.scenes[sceneIndex].id, 'playlists', patchData, 'remove', true, false, self.selectedScenes);
                    for (var i = 0; i < self.selectedScenes.length; i++) {
                        self.removeSceneFromList(self.selectedScenes[i])
                    }


                } else {

                    $rootScope.patchEntity('scene', self.scenes[sceneIndex].id, 'playlists', patchData, 'remove', false, false, self.selectedScenes);
                    self.removeSceneFromList(sceneToRemove);
                }


            };
            
            self.chipOnAdd = function (chip, addedChipType) {
                 // self.addItem(chip, addedChipType)
            };

            self.chipOnRemove = function (chip, removedChipType) {
                // self.removeItem (chip, removedChipType)
            };

            self.chipOnSelect = function (chip, selectedChipType) {

                var dest_path = "";

                if (selectedChipType == 'websites'){
                    dest_path = '/website/' + chip.id;
                }else if (selectedChipType == 'actors'){
                    dest_path = '/actor/' + chip.id;
                }else if (selectedChipType == 'scene_tags'){
                    dest_path = '/scene-tag/' + chip.id;
                }


                $location.path(dest_path);
                $location.replace();

            };

            self.transformChip = function (chip) {

                // alert(angular.toJson(chip));
                // If it is an object, it's already a known chip
                if (angular.isObject(chip)) {
                    if (chip.id == -1){
                        return null;
                    }
                    return chip;
                }


            }

            // self.infiniteScenes = [];
            //
            //
            // // In this example, we set up our model using a plain object.
            // // Using a class works too. All that matters is that we implement
            // // getItemAtIndex and getLength.
            // this.infiniteItems = {
            //     numLoaded_: 0,
            //     toLoad_: 0,
            //     counter_: 1,
            //     finished_: false,
            //     // infiniteScenes_: [],
            //
            //
            //     // Required.
            //     getItemAtIndex: function (index) {
            //         if (index > this.numLoaded_ && !this.finished_) {
            //             this.fetchMoreItems_(index);
            //             return null;
            //         }
            //
            //         if (self.totalItems == -6 || self.totalItems <= this.numLoaded_) {
            //             this.finished_ = true;
            //         }
            //
            //
            //
            //         if (self.infiniteScenes[index] != undefined) {
            //             return self.infiniteScenes[index];
            //         } else {
            //             // return null;
            //         }
            //
            //
            //     },
            //
            //     // Required.
            //     // For infinite scroll behavior, we always return a slightly higher
            //     // number than the previously loaded items.
            //     getLength: function () {
            //         return this.numLoaded_ + 10;
            //     },
            //
            //     fetchMoreItems_: function (index) {
            //         // For demo purposes, we simulate loading more items with a timed
            //         // promise. In real code, this function would likely contain an
            //         // $http request.
            //
            //         if (this.toLoad_ < index && !this.finished_) {
            //             this.toLoad_ += 10;
            //             $scope.gotPromiseSceneList = false;
            //             self.nextPage(this.counter_);
            //             this.counter_ += 1;
            //
            //
            //
            //
            //
            //
            //             // while(!gotPromise){
            //             //
            //             // }
            //             // console.log("Got Promise");
            //
            //             // $http.get('/api/scene/', {
            //             //     params: {
            //             //         offset: this.numLoaded_,
            //             //         limit: this.toLoad_
            //             //
            //             //     }
            //             //
            //             // }).then(function (response) {
            //             //
            //             //     for (var x = 0 ; x < response.data.length; x++){
            //             //         this.infiniteScenes_.push(response.data[x])
            //             //     }
            //             //
            //             //     // alert(angular.toJson(response));
            //             //     // self.response = response.data.vlc_path;
            //             //     // self.pathToVLC = response.data.vlc_path;
            //             //     // alert("Got response from server: " + self.pathToFolderToAdd);
            //             // }, function errorCallback(response) {
            //             //     alert("Something went wrong!" + angular.toJson(response));
            //             // });
            //
            //             this.numLoaded_ = this.toLoad_;
            //
            //         }
            //     }
            // };


        }
    ]
});
