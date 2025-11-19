import { createAction } from 'redux-actions';
import type { ScheduleInstance } from '../../models/schedule';

import types from './types';

export const fetchSchedule = createAction(types.FETCH_SCHEDULE);
export const fetchScheduleSuccess = createAction(types.FETCH_SCHEDULE_SUCCESS);
export const fetchScheduleFailed = createAction(types.FETCH_SCHEDULE_FAILED);

export const updateSchedule = createAction(types.UPDATE_SCHEDULE, (schedule: ScheduleInstance) => schedule);
export const updateScheduleSuccess = createAction(types.UPDATE_SCHEDULE_SUCCESS);
export const updateScheduleFailed = createAction(types.UPDATE_SCHEDULE_FAILED);
