// components/EventPopup.tsx
import React from "react";
import "../eventpopup.scss";
import dayjs from "dayjs";

interface EventPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const EventPopup: React.FC<EventPopupProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { title, date, staff, shift } = data;
  const parsedDate = dayjs(date).format("DD.MM.YYYY");

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="popup-title">{title} - {parsedDate}</h3>

        {/* STAFF INFO */}
        <div className="popup-section">
          <h4>👤 Personel Information</h4>
          <ul>
            <li><strong>Staff Name:</strong> {staff.name}</li>
            <li><strong>🚫 Off Days</strong>
              <ul>
                {staff.offDays.length > 0
                  ? staff.offDays.map((d: any) => <li key={d}>{d}</li>)
                  : <li>—</li>}
              </ul>
            </li>
          </ul>
        </div>

        {/* SHIFT */}
        <div className="popup-section">
          <h4>🕒 Shift Information</h4>
          <ul>
            <li><strong>Name:</strong> {shift.name}</li>
            <li><strong>Start Time:</strong> {shift.shiftStart}</li>
            <li><strong>Finish Time:</strong> {shift.shiftEnd}</li>
            <li><strong>Duration:</strong> {shift.shiftDurationHourly} hours</li>
          </ul>
        </div>

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default EventPopup;
