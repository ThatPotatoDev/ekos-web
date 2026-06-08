export const DAEMON = "daemon";
export const IMAGE_DATA = 'image_data';
export const NEW_GPS_STATE = 'new_gps_state';

export const LIVESTACK_IMAGE = 'livestack_image';
export const LIVESTACK_LOG = 'livestack_log';

export const GET_CONNECTION = 'get_connection';
export const GET_STATES = 'get_states';
export const GET_DRIVERS = 'get_drivers';
export const GET_DEVICES = 'get_devices';

export const NEW_CONNECTION_STATE = 'new_connection_state';
export const NEW_MOUNT_STATE = 'new_mount_state';
export const NEW_CAMERA_STATE = 'new_camera_state';
export const NEW_CAPTURE_STATE = 'new_capture_state';
export const NEW_GUIDE_STATE = 'new_guide_state';
export const NEW_FOCUS_STATE = 'new_focus_state';
export const NEW_ALIGN_STATE = 'new_align_state';
export const NEW_POLAR_STATE = 'new_polar_state';
export const NEW_DOME_STATE = 'new_dome_state';
export const NEW_CAP_STATE = 'new_cap_state';
export const NEW_PREVIEW_IMAGE = 'new_preview_image';
export const NEW_VIDEO_FRAME = 'new_video_frame';
export const NEW_ALIGN_FRAME = 'new_align_frame';
export const NEW_NOTIFICATION = 'new_notification';
export const NEW_TEMPERATURE = 'new_temperature';
export const NEW_INDI_STATE = 'new_indi_state';

export const SET_CLIENT_STATE = 'set_client_state';
export const LOGOUT = 'logout';

export const GET_PROFILES = 'get_profiles';
export const START_PROFILE = 'profile_start';
export const STOP_PROFILE = 'profile_stop';
export const ADD_PROFILE = 'profile_add';
export const GET_PROFILE = 'profile_get';
export const DELETE_PROFILE = 'profile_delete';
export const UPDATE_PROFILE = 'profile_update';
export const SET_PROFILE_MAPPING = 'profile_set_mapping';

export const GET_SCOPES = 'get_scopes';
export const ADD_SCOPE = 'scope_add';
export const DELETE_SCOPE = 'scope_delete';
export const UPDATE_SCOPE = 'scope_update';

export const CAPTURE_PREVIEW = 'capture_preview';
export const CAPTURE_TOGGLE_VIDEO = 'capture_toggle_video';
export const CAPTURE_TOGGLE_CAMERA = 'capture_toggle_camera';
export const CAPTURE_TOGGLE_FILTER_WHEEL = 'capture_toggle_filter_wheel';
export const CAPTURE_START = 'capture_start';
export const CAPTURE_STOP = 'capture_stop';
export const CAPTURE_ADD_SEQUENCE = 'capture_add_sequence';
export const CAPTURE_REMOVE_SEQUENCE = 'capture_remove_sequence';
export const CAPTURE_CLEAR_SEQUENCES = 'capture_clear_sequences'; // kinda broken
export const CAPTURE_GET_SEQUENCES = 'capture_get_sequences';
export const CAPTURE_SET_ALL_SETTINGS = 'capture_set_all_settings';
export const CAPTURE_GET_ALL_SETTINGS = 'capture_get_all_settings';
export const CAPTURE_GET_PREVIEW_LABEL = 'capture_get_preview_label';
export const CAPTURE_LOOP = 'capture_loop';

export const MOUNT_PARK = "mount_park";
export const MOUNT_UNPARK = "mount_unpark";
export const MOUNT_ABORT = "mount_abort";
export const MOUNT_SYNC_RADE = "mount_sync_rade";
export const MOUNT_SYNC_TARGET = "mount_sync_target";
export const MOUNT_GOTO_RADE = "mount_goto_rade";
export const MOUNT_GOTO_TARGET = "mount_goto_target";
export const MOUNT_GOTO_PIXEL = "mount_goto_pixel";
export const MOUNT_SET_MOTION = "mount_set_motion";
export const MOUNT_SET_TRACKING = "mount_set_tracking";
export const MOUNT_SET_SLEW_RATE = "mount_set_slew_rate";
export const MOUNT_CLEAR = "mount_clear";
export const MOUNT_GET_ALL_SETTINGS = "mount_get_all_settings";
export const MOUNT_SET_ALL_SETTINGS = "mount_set_all_settings";
export const MOUNT_TOGGLE_AUTOPARK = "mount_toggle_autopark";

export const DOME_PARK = 'dome_park';
export const DOME_UNPARK = 'dome_unpark';
export const DOME_GOTO = 'dome_goto';
export const DOME_STOP = 'dome_stop';

export const CAP_PARK = 'cap_park';
export const CAP_UNPARK = 'cap_unpark';
export const CAP_SET_LIGHT = 'cap_set_light';

export const FOCUS_START = "focus_start";
export const FOCUS_CAPTURE = "focus_capture";
export const FOCUS_STOP = "focus_stop";
export const FOCUS_RESET = "focus_reset";
export const FOCUS_IN = "focus_in";
export const FOCUS_OUT = "focus_out";
export const FOCUS_LOOP = "focus_loop";
export const FOCUS_SET_ALL_SETTINGS = "focus_set_all_settings";
export const FOCUS_GET_ALL_SETTINGS = "focus_get_all_settings";
export const FOCUS_SET_CROSSHAIR = "focus_set_crosshair";

export const GUIDE_START = 'guide_start';
export const GUIDE_STOP = 'guide_stop';
export const GUIDE_CLEAR = 'guide_clear';

export const ALIGN_SOLVE = "align_solve";
export const ALIGN_STOP = "align_stop";
export const ALIGN_LOAD_AND_SLEW = "align_load_and_slew";
export const ALIGN_SET_FILE_EXTENSION = "align_set_file_extension";
export const ALIGN_SET_ALL_SETTINGS = "align_set_all_settings";
export const ALIGN_GET_ALL_SETTINGS = "align_get_all_settings";
export const ALIGN_SET_ASTROMETRY_SETTINGS = "align_set_astrometry_settings";
export const ALIGN_MANUAL_ROTATOR_STATUS = "align_manual_rotator_status";
export const ALIGN_MANUAL_ROTATOR_TOGGLE = "align_manual_rotator_toggle";

export const PAH_START = 'polar_start';
export const PAH_STOP = 'polar_stop';
export const PAH_REFRESH = 'polar_refresh';
export const PAH_SET_CROSSHAIR = 'polar_set_crosshair';
export const PAH_SELECT_STAR_DONE = 'polar_star_select_done';
export const PAH_REFRESHING_DONE = 'polar_refreshing_done';
export const PAH_RESET_VIEW = 'polar_reset_view';
export const PAH_SLEW_DONE = 'polar_slew_done';
export const PAH_PAH_SET_ZOOM = 'polar_set_zoom';
export const PAH_SET_ALGORITHM = 'polar_set_algorithm';

export const OPTION_GET = 'option_get';
export const OPTION_SET = 'option_set';

export const SET_BLOBS = 'set_blobs';

export const DSLR_GET_INFO = 'dslr_get_info';
export const DSLR_SET_INFO = 'dslr_set_info';
export const DSLR_SET_MODE = 'dslr_set_mode';

export const DEVICE_GET = 'device_get';
export const DEVICE_RESTART = 'device_restart';
export const DEVICE_BLOB_GET = 'device_blob_get';
export const DEVICE_PROPERTY_GET = 'device_property_get';
export const DEVICE_PROPERTY_SET = 'device_property_set';
export const DEVICE_PROPERTY_ADD = 'device_property_add';
export const DEVICE_PROPERTY_REMOVE = 'device_property_remove';
export const DEVICE_PROPERTY_SUBSCRIBE = 'device_property_subscribe';
export const DEVICE_PROPERTY_UNSUBSCRIBE = 'device_property_unsubscribe';

export const DIALOG_GET_INFO = 'dialog_get_info';
export const DIALOG_GET_RESPONSE = 'dialog_get_response';

export const FM_GET_DATA = 'fm_get_data';
export const FM_SET_DATA = 'fm_set_data';

export const ASTRO_GET_ALMANC = "astro_get_almanac";
export const ASTRO_GET_NAMES = "astro_get_names";
export const ASTRO_GET_DESIGNATIONS = "astro_get_designations";
export const ASTRO_GET_LOCATION = "astro_get_location";
export const ASTRO_SEARCH_OBJECTS = "astro_search_objects";
export const ASTRO_GET_OBJECT_INFO = "astro_get_object_info";
export const ASTRO_GET_OBJECTS_INFO = "astro_get_objects_info";
export const ASTRO_GET_OBJECTS_IMAGE = "astro_get_objects_image";
export const ASTRO_GET_SKYPOINT_IMAGE = "astro_get_skypoint_image";
export const ASTRO_GET_OBJECTS_OBSERVABILITY = "astro_get_objects_observability";
export const ASTRO_GET_OBJECTS_RISESET = "astro_get_objects_riseset";

export const IndiStatus = Object.freeze({
    Idle: 0,
    Pending: 1,
    Success: 2,
    Error: 3
});
export const SkyObject = Object.freeze({
    STAR: 0,
    CATALOG_STAR: 1,
    PLANET: 2,
    OPEN_CLUSTER: 3,
    GLOBULAR_CLUSTER: 4,
    GASEOUS_NEBULA: 5,
    PLANETARY_NEBULA: 6,
    SUPERNOVA_REMNANT: 7,
    GALAXY: 8,
    COMET: 9,
    ASTEROID: 10,
    CONSTELLATION: 11,
    MOON: 12,
    ASTERISM: 13,
    GALAXY_CLUSTER: 14,
    DARK_NEBULA: 15,
    QUASAR: 16,
    MULT_STAR: 17,
    RADIO_SOURCE: 18,
    SATELLITE: 19,
    SUPERNOVA: 20,
    NUMBER_OF_KNOWN_TYPES: 21,
    TYPE_UNKNOWN: 255
});