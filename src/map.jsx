import ReactMapboxGl, { Marker, Layer, MapContext, Source, Image } from 'react-mapbox-gl';
import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Button, Typography } from '@material-ui/core';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@material-ui/core';
import { Card, CardActionArea, CardActions, CardContent, CardMedia, FormControl, Select} from '@material-ui/core';
import { MenuItem, FormHelperText } from '@material-ui/core';
import { SketchField, Tools } from 'react-sketch';
import axios from 'axios';
import DrawControl from "react-mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import Library from './images/Library-first.png';
import Nb from './images/NB-first.png';

const Map = ReactMapboxGl({
    accessToken:
        'pk.eyJ1IjoiZmVyb3g5OCIsImEiOiJja2ZtbDl6M2sxMmMyMnBxbTg0NG1ibzN6In0.RZvALnpminibmnNwF3L_wA'
});
let _map = null;
let draw = null;

const useStyles = makeStyles({
    root: {
        maxWidth: 345,
        margin: 10
    },

    media: {
        height: 300,
        width: 300
    },

    formControl: {
        //margin: theme.spacing(1),
        minWidth: 120,
    },
})
export default function Mapbox(props) {
    
    const classes = useStyles();
    const [floorOpen, setFloorOpen] = React.useState(false);
    const [buildingOpen, setBuildingOpen] = React.useState(false);
    const [markerOpen, setMarkerOpen] = React.useState(false);
    const [viewType, setViewType] = React.useState('map');

    const [building, setBuilding] = useState({
        name: null,
        lat: null,
        lng: null,
    });
    const [floor, setFloor] = useState({
        building_name: null,
        floor_number: null,
    })
    const [cur_floor, setCurFloor] = useState(0);
    const [buildings, setBuildings] = useState(null);
    const [intersections, setIntersections] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [floorDesign, setFloorDesign] = useState(null);
    const [controlEnabled, setControlEnabled] = useState(false);
    const [renderMap, setRenderMap] = useState(true);
    const [room, setRoom] = useState({
        building: null,
        room_name: null,
        lat: null,
        lng: null
    });
    const [roomEnabled, setRoomEnabled] = useState(false);

    async function fetchBuildings() {
        axios({
            method: 'get',
            url: 'https://immense-stream-44438.herokuapp.com/buildings',
        }).then((res) => {
            // console.log(res);
            setBuildings(res.data)})
          .catch((error) => console.log(error));
    }

    async function fetchIntersections() {
        axios({
            method: 'get',
            url: 'https://immense-stream-44438.herokuapp.com/intersections'
        }).then((res) => {
            // console.log(res);
            setIntersections(res.data);
        }).catch((error) => console.log(error));
    }

    useEffect(() => {
        if (buildings === null) fetchBuildings();
        if (intersections === null) fetchIntersections();
    }, [])

    const handleFloorInput = (e) => {
        setFloor({...floor, [e.target.name] : e.target.value});
    }

    const handleRoomInput = (e) => {
        setRoom({...room, [e.target.name]: e.target.value});
    }

    const handleOnImageInput = (e) => {
        if (e.target.files[0]) {
            setFloorDesign(e.target.files[0]);
        }
    }

    const onDrawCreate = (e) => {
        console.log(e);
        if (e.features[0].geometry.type === 'Point') {
            setRoomEnabled(true);
            setRoom({...room, 
                lat: e.features[0].geometry.coordinates[1],
                lng: e.features[0].geometry.coordinates[0],
                floor_number: cur_floor
            });
        }
        else if (e.features[0].geometry.type === 'LineString') {
            const body = {
                connections: e.features[0].geometry.coordinates,
                level: cur_floor
            }
            axios({
                method: 'post',
                data: body,
                url: 'https://immense-stream-44438.herokuapp.com/intersections'
            }).then(res => console.log(res))
              .catch(error => console.log(error));
        }   
    };

    const onDrawUpdate = ({ features }) => {
        console.log(features);
    };
    
    const mapClick = (m, e) => {
     
        if (markerOpen) {
            console.log(e.lngLat.lat + " , " + e.lngLat.lng);

            setBuilding({...building, 
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
            })
            // console.log(building);
            setMarkerOpen(false);
            setBuildingOpen(false);
            axios({
                method: 'post',
                url: 'https://immense-stream-44438.herokuapp.com/buildings',
                data: {
                    name: building.name,
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng
                }
            }).then((res) => {console.log(res)})
              .catch((error) => console.log(error));
        }

        else {
            console.log('marker not open');
        }
        
    }

    const renderBuildings = () => {
        let design_array = [];
        for (let i = 0; i < buildings.length; i++) {
            const b = buildings[i];
            for (let j = 0; j < b.floors.length; j++) {
                const filename = b.floors[j].floor_design;
                const level = b.floors[j].floor_number;
                design_array.push(
                    <Card className={classes.root}>
                        <CardActionArea>
                            <CardMedia 
                                className={classes.media}
                                image={`https://immense-stream-44438.herokuapp.com/uploads/${filename}`}
                                title={''}
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="h2">{`Building: ${b.name}`}</Typography>
                                <Typography gutterBottom variant="h7" component="h3">{`Floor: ${level}`}</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                )
            }
        }
        return design_array;
    }
    
    const handleChange = (event) => {
        setViewType(event.target.value);
    };

    const handleFloorChange = (event) => {
        console.log("floor changed to: " + event.target.value);
        setCurFloor(parseInt(event.target.value));
    }

    const uploadRoom = (e) => {
        axios({
            method: 'post',
            url: 'https://immense-stream-44438.herokuapp.com/buildings/room',
            data: room
        }).then((res) => console.log(res.data))
          .catch((error) => console.log(error));
        setRoomEnabled(false);
        
    }
    const uploadFloor = (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append('building', floor.building_name);
        form.append('floor_number', floor.floor_number);
        form.append('floorImage', floorDesign);
        console.log("Form is: ");
        console.log(form);
        console.log("floor is: ");
        console.log(floor);

        axios({
            method: 'post',
            url: 'https://immense-stream-44438.herokuapp.com/buildings/floor',
            data: form,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((res) => {
        })
          .catch(error => console.log(error));
        setFloorOpen(false);
    }
    return (
        <Grid container>
            <Dialog open={roomEnabled} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Enter Room Details</DialogTitle>
                <DialogContent>
                    <Grid style={{flex: 1, justifyContent: 'flex-start'}}>
                        <TextField autoFocus id="building" name="building" label="Building Name" onChange={handleRoomInput} />
                    </Grid>
                    <Grid style={{flex: 1, justifyContent: 'flex-end', marginTop: 7}}>
                        <TextField id="room_name" name="room_name" label="Room Name" onChange={handleRoomInput} />
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {setRoomEnabled(false)}} color='primary'>Cancel</Button>
                    <Button variant='contained' onClick={uploadRoom} color='primary'>Add Room</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={floorOpen} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Add a floor</DialogTitle>
                <DialogContent>
                    <Grid style={{flex: 1, justifyContent: 'flex-start'}}>
                        <TextField autoFocus id="building_name" name="building_name" label="Building Name" onChange={handleFloorInput} />
                    </Grid>
                    <Grid style={{flex: 1, justifyContent: 'flex-end', marginTop: 7}}>
                        <TextField id="floorNumber" name="floor_number" label="Floor Number" onChange={handleFloorInput} />
                    </Grid>    
                    <Button style={{marginTop: 10}} variant='contained' color='primary' component='label'>Upload Floor Design<input
                        onChange={handleOnImageInput}
                        type="file"
                        style={{ display: "none" }}
                    /></Button>                        
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {setFloorOpen(false)}} color="primary">
                        Cancel
                    </Button>
                    <Button variant='contained' onClick={uploadFloor} color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={buildingOpen} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Add a Building</DialogTitle>
                <DialogContent>
                    <Grid style={{flex: 1, justifyContent: 'flex-start'}}>
                        <TextField autoFocus id="building_name" name="building_name" label="Building Name" onChange={(e) => {setBuilding({...building, name: e.target.value})}} />
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {setBuildingOpen(false)}} color="primary">
                        Cancel
                    </Button>
                    <Button variant='contained' onClick={() => {setBuildingOpen(false); setMarkerOpen(true)}} color="primary">
                        Add
                    </Button>   
                </DialogActions>
            </Dialog>
            {
                viewType === 'map' && (
                    <>
                        <Grid item md={10} xs={10} sm={10} style={{cursor: 'crosshair'}}>
                            <Map
                                style="mapbox://styles/mapbox/streets-v10"
                                bearing={[-13]}
                                pitch={[0]}
                                center={[38.76327, 9.040510]}
                                onClick={mapClick}
                                containerStyle={{
                                    height: '100vh',
                                    width: '100vw'
                                }}
                                zoom={[18.3]}
                                minZoom={[18]}
                            >
                                <MapContext.Consumer>
                                    {
                                        (map) => {
                                            map.on('style.load', function () {
                                                console.log('loaded');
                                            })
                                            _map = map;
                                            if (draw === null) {
                                                draw = new MapboxDraw({
                                                    displayControlsDefault: true,
                                                    controls: {
                                                        polygon: false,
                                                        trash: true,
                                                        point: true,
                                                        line_string: true,
                                                        uncombine_features: false
                                                    }
                                                })
                                             
                                                map.addControl(draw);
                                                map.on('draw.create', onDrawCreate);
                                                map.on('draw.update', onDrawUpdate);
                                            }
                                             
                                            if (buildings && intersections) {
                                                const featureCollection = {
                                                    type: 'FeatureCollection',
                                                    features: []
                                                }
                                                for (let i = 0; i < buildings.length; i++) {
                                                    const lng = buildings[i].lng;
                                                    const lat = buildings[i].lat;
                                                    const rooms = buildings[i].rooms;
        
                                                    // display rooms
                                                    console.log('displaying rooms at building ' + buildings[i].name);
                                                    rooms.forEach((room, idx) => {
                                                        console.log(room);
                                                        var feature = {
                                                            type: 'Feature', 
                                                            properties: {},
                                                            id: `feature-100`,
                                                            geometry: {
                                                                type: 'Point',
                                                                coordinates: [room.lng, room.lat]
                                                            }
                                                        }
                                                        featureCollection.features.push(feature);
                                                    })


                                                    buildings[i].floors.map((floor, idx) => {
                                                        // load all images and add them to mapbox if they're not there
                                                        const design_name = floor.floor_design;
                                                        if (!map.hasImage(design_name)) {
                                                            map.loadImage(`https://immense-stream-44438.herokuapp.com/uploads/${floor.floor_design}`,
                                                                function (error, image) {
                                                                    console.log(error);
                                                                    map.addImage(design_name, image);
                                                                }
                                                            )
                                                        } 
                                                        if (map.getLayer(`points-${i}`)) {
                                                            map.removeLayer(`points-${i}`);                                                                
                                                        }
                                                        if (map.getSource(`point-${i}`)) {
                                                            map.removeSource(`point-${i}`)
                                                        }
                                                        if (floor.floor_number === cur_floor) {
                                                            
                                                            console.log("Adding " + design_name);
                                                            map.addSource(`point-${i}`, {
                                                                'type': 'geojson',
                                                                'data': {
                                                                    'type': 'FeatureCollection',
                                                                    'features': [
                                                                        {
                                                                            'type': 'Feature',
                                                                            'geometry': {
                                                                                'type': 'Point',
                                                                                'coordinates': [lng, lat]
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            });
                                                            map.addLayer({
                                                                'id': `points-${i}`,
                                                                'type': 'symbol',
                                                                'source': `point-${i}`,
                                                                'layout': {
                                                                    'icon-image': design_name,
                                                                    'icon-size': [
                                                                        'interpolate',
                                                                        ['exponential', 1.5],
                                                                        ['zoom'],
                                                                        18,
                                                                        0.3,
                                                                        20,
                                                                        1
                                                                    ]
                                                                }
                                                            }, 'gl-draw-polygon-fill-inactive.cold');
                                                        }
                                                    })
                                                            
                                                }
                                                
                                                intersections.map((intersection, idx) => {
                                                    if (intersection.level === cur_floor) {
                                                        var feature = {
                                                            type: 'Feature', 
                                                            properties: {},
                                                            id: `feature-${idx}`,
                                                            geometry: {
                                                                type: 'LineString',
                                                                coordinates: intersection.connections
                                                            }
                                                        }
                                                        featureCollection.features.push(feature);
                                                        
                                                    }                                      
                                                })
                                                console.log(featureCollection);
                                                if (featureCollection.features.length > 0) {
                                                    var ids = draw.set(featureCollection);
                                                }
                                                else {
                                                    console.log("deleting all");
                                                    draw.deleteAll();
                                                }
                                            }
                                            else {
                                                console.log("refusing");
                                            }
                                        }
                                        
                                         
                                    }
                                </MapContext.Consumer>
                                
                                
                                {/* <DrawControl onDrawCreate={onDrawCreate} onDrawUpdate={onDrawUpdate} /> */}
                                <Button style={{visibility: markerOpen? 'visible' : 'hidden'}}>Click on the map to place building location</Button>

                            </Map>
                        </Grid>
                        <Grid item md={2} sm={2}>
                            <Grid container>
                                <FormControl className={classes.formControl}>
                                    <Select
                                        value={viewType}
                                        onChange={handleChange}
                                        inputProps={{ 'aria-label': 'Without label' }}
                                    >
                                        <MenuItem value="map">
                                            Map View
                                        </MenuItem>
                                        <MenuItem value="buildings">Buildings View</MenuItem>
                                    </Select>
                                    <FormHelperText>Select View</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid container>
                            <FormControl className={classes.formControl}>
                                <Select
                                    value={cur_floor}
                                    onChange={handleFloorChange}
                                    inputProps={{ 'aria-label': 'Without label' }}
                                >
                                    <MenuItem value="0">
                                        Ground
                                    </MenuItem>
                                    <MenuItem value="1">First Floor</MenuItem>
                                    <MenuItem value="2">Second Floor</MenuItem>
                                    <MenuItem value="3">Third Floor</MenuItem>
                                </Select>
                                <FormHelperText>Select Floor</FormHelperText>
                            </FormControl>
                            </Grid>
                            <Grid container>
                                <Button style={{color: '#cedbd9', backgroundColor: '#3495eb', marginTop: 10}} onClick={() => {setBuildingOpen(true)}}>Add Building</Button>
                            </Grid>
                            <Grid container>
                                <Button style={{color: '#cedbd9', backgroundColor: '#3495eb', marginTop: 10}} onClick={() => {setFloorOpen(true)}} variant='contained'>Add Floor</Button>
                            </Grid>
                        </Grid>
                        {/* <Grid item md={2} sm={2}>
                            <TextField label="Enter Building Name: " style={{ visibility: buildingOpen? 'visible': 'hidden' }} onChange={(e) => {setBuilding({...building, name: e.target.value })}} />
                            <Button style={{visibility: buildingOpen? 'visible': 'hidden', color: '#cedbd9', backgroundColor: '#3495eb'}} onClick={() => {setMarkerOpen(true)}}>Next</Button>
                        </Grid> */}
                    </> 
                    
                )
            }
            {
                viewType === 'buildings' && buildings && (
                    <Grid container>
                        <Grid item md={10} sm={10} xs={10}>
                        </Grid>
                        <Grid item md={2} sm={2} xs={2}>
                            <Grid container>
                                <FormControl className={classes.formControl}>
                                    <Select
                                        value={viewType}
                                        onChange={handleChange}
                                        inputProps={{ 'aria-label': 'Without label' }}
                                    >
                                        <MenuItem value="map">
                                            Map View
                                        </MenuItem>
                                        <MenuItem value="buildings">Buildings View</MenuItem>
                                    </Select>
                                    <FormHelperText>Select View</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid container>
                                <Button style={{color: '#cedbd9', backgroundColor: '#3495eb', marginTop: 10}} onClick={() => {setFloorOpen(true)}} variant='contained'>Add Floor</Button>
                            </Grid>
                        </Grid>
                        <Grid item>
                        {
                            renderBuildings()
                        }
                        </Grid>
                        
                    </Grid>
                    
                )
            }
           
        </Grid>
        
    )
}