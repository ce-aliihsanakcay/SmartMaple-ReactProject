/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { updateSchedule } from "../../store/schedule/actions";

import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";
import EventPopup from "../EventPopup/index";

import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

import type { EventInput } from "@fullcalendar/core/index.js";

import "../profileCalendar.scss";
import { getColorIndex } from "../../utils/colorStyles";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const dispatch = useDispatch<any>();

  const [events, setEvents] = useState<EventInput[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);

  const handleEventDrop = (info: EventDropArg) => {
    const event = info.event;
    const assignment = schedule.assignments.find(a => a.id === event.id);

    if (!assignment) return;

    const newShiftStart = dayjs(event.start)
      .hour(dayjs(assignment.shiftStart).hour())
      .minute(dayjs(assignment.shiftStart).minute())
      .second(0)
      .millisecond(0)
      .toISOString();

    const newShiftEnd = dayjs(event.start)
      .hour(dayjs(assignment.shiftEnd).hour())
      .minute(dayjs(assignment.shiftEnd).minute())
      .second(0)
      .millisecond(0)
      .toISOString();

    const updatedSchedule = {
      ...schedule,
      assignments: schedule.assignments.map(a => {
        if (a.id === event.id) {
          a.shiftStart = newShiftStart;
          a.shiftEnd = newShiftEnd;
        }
        return a;
      })
    };

    dispatch(updateSchedule(updatedSchedule));
  };

  const handleEventClick = (clickEventInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickEventInfo.event.id);
    if (!event) return;

    const staff = schedule?.staffs?.find((staff) => staff.id === event?.staffId);
    const shift = schedule?.shifts?.find((shift) => shift.id === event?.shiftId);
    event.staff = staff;
    event.shift = shift;

    if (event) {
      setSelectedEvent(event);
      setPopupOpen(true);
    }
  };

  const getPlugins = () => {
    const plugins = [dayGridPlugin];

    plugins.push(interactionPlugin);
    return plugins;
  };

  const getShiftById = (id: string) => {
    return schedule?.shifts?.find((shift: { id: string }) => id === shift.id);
  };

  const getAssigmentById = (id: string) => {
    return schedule?.assignments?.find((assign) => id === assign.id);
  };

  const validDates = () => {
    const dates = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    while (
      currentDate.isBefore(schedule.scheduleEndDate) ||
      currentDate.isSame(schedule.scheduleEndDate)
    ) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  };

  const getDatesBetween = (startDate: string, endDate: string) => {
    const dates = [];
    const start = dayjs(startDate, "DD.MM.YYYY").toDate();
    const end = dayjs(endDate, "DD.MM.YYYY").toDate();
    const current = new Date(start);

    while (current <= end) {
      dates.push(dayjs(current).format("DD-MM-YYYY"));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const generateStaffBasedCalendar = () => {
    const works: EventInput[] = [];

    const filteredAssignments = schedule?.assignments?.filter(
      (assign) => assign.staffId === selectedStaffId
    ) || [];

    for (let i = 0; i < filteredAssignments.length; i++) {
      const assignmentDate = dayjs
        .utc(filteredAssignments[i]?.shiftStart)
        .format("YYYY-MM-DD");
      const isValidDate = validDates().includes(assignmentDate);

      const work = {
        id: filteredAssignments[i]?.id,
        title: getShiftById(filteredAssignments[i]?.shiftId)?.name,
        duration: "01:00",
        date: assignmentDate,
        staffId: filteredAssignments[i]?.staffId,
        shiftId: filteredAssignments[i]?.shiftId,
        className: `event 
          ${getAssigmentById(filteredAssignments[i]?.id)?.isUpdated
            ? "highlight"
            : ""
          } 
          ${!isValidDate ? "invalid-date" : ""} 
        `,
      };
      works.push(work);
    }

    const offDays = schedule?.staffs?.find(
      (staff) => staff.id === selectedStaffId
    )?.offDays;
    const dates = getDatesBetween(
      dayjs(schedule.scheduleStartDate).format("DD.MM.YYYY"),
      dayjs(schedule.scheduleEndDate).format("DD.MM.YYYY")
    );
    let highlightedDates: string[] = [];

    dates.forEach((date) => {
      const transformedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
      if (offDays?.includes(transformedDate)) highlightedDates.push(date);
    });

    setHighlightedDates(highlightedDates);
    setEvents(works);
  };

  useEffect(() => {
    if (selectedStaffId) return;
    const firstStaffId = schedule?.staffs?.[0]?.id;
    setSelectedStaffId(firstStaffId);
  }, [schedule]);

  useEffect(() => {
    if (!selectedStaffId) return;
    generateStaffBasedCalendar();
  }, [selectedStaffId, schedule]);

  const RenderEventContent = ({ eventInfo }: any) => {
    return (
      <div className="event-content">
        <p>{eventInfo.event.title}</p>
      </div>
    );
  };

  return (
    <div className="calendar-section">
      <div className="calendar-wrapper">
        <div className="staff-list">
          {schedule?.staffs?.map((staff: any, index: number) => (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
              className={`staff 
                color-${getColorIndex(index)} 
                borderColor-${getColorIndex(index)} 
                ${staff.id === selectedStaffId
                  ? `active color-white bg-${getColorIndex(index)} fill-white`
                  : ""
                } 
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path
                  className={`
                    fill-${getColorIndex(index)} 
                    ${staff.id === selectedStaffId ? `active fill-white` : ""}
                  `}
                  d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z"
                />
              </svg>
              <span>{staff.name}</span>
            </div>
          ))}
        </div>

        <FullCalendar
          ref={calendarRef}
          locale={auth.language}
          plugins={getPlugins()}
          contentHeight={550}
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          eventClick={handleEventClick}
          firstDay={1}
          dayMaxEventRows={4}
          eventDrop={handleEventDrop}
          fixedWeekCount={true}
          showNonCurrentDates={true}
          eventContent={(eventInfo: any) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          datesSet={(info: any) => {
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;

            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule?.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate()
              )
            )
              setInitialDate(calendarRef?.current?.getApi().getDate());

            const startDiff = dayjs(info.start)
              .utc()
              .diff(
                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                "days"
              );
            const endDiff = dayjs(dayjs(schedule.scheduleEndDate)).diff(
              info.end,
              "days"
            );
            if (startDiff < 0 && startDiff > -35) prevButton.disabled = true;
            else prevButton.disabled = false;

            if (endDiff < 0 && endDiff > -32) nextButton.disabled = true;
            else nextButton.disabled = false;
          }}
          dayCellContent={({ date }) => {
            const found = validDates().includes(
              dayjs(date).format("YYYY-MM-DD")
            );
            const isHighlighted = highlightedDates.includes(
              dayjs(date).format("DD-MM-YYYY")
            );

            const staff = schedule?.staffs?.find((s) => s.id === selectedStaffId);
            let highlightedPair: string = "";
            if (staff) {
              const staffPairList = staff && staff.pairList;
              staffPairList?.forEach((pair) => {
                schedule?.staffs?.map((staff: any, index: number) => {
                  if (pair.staffId === staff.id)
                    pair.colorIndex = index;
                })
              });
              staffPairList?.forEach((pair) => {
                const isHighlightedPair = getDatesBetween(pair.startDate, pair.endDate)
                  .includes(dayjs(date).format("DD-MM-YYYY"));
                const isThereAnyEvent = events.find(e => e.date === dayjs(date).format("YYYY-MM-DD"));

                if (isHighlightedPair && isThereAnyEvent) {
                  highlightedPair = `borderBottom-${pair.colorIndex}`;
                }
              })
            }

            return (
              <div
                className={`${found ? "" : "date-range-disabled"} 
                  ${isHighlighted ? "highlighted-date-orange" : ""} 
                  ${highlightedPair} 
                `}
              >
                {dayjs(date).date()}
              </div>
            );
          }}
        />

        <EventPopup
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
          data={selectedEvent}
        />
      </div>
    </div>
  );
};

export default CalendarContainer;
