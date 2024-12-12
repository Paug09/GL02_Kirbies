// split the time slots in 30min slots
const splitInto30MinuteSlots = (day, timeRange) => {
    const [start, end] = timeRange.split('-');
    const slots = [];
    let [startHour, startMinute] = start.split(':').map(num => parseInt(num));
    const [endHour, endMinute] = end.split(':').map(num => parseInt(num));

    while (startHour < endHour || (startHour === endHour && startMinute < endMinute)) {
        const nextMinute = (startMinute + 30) % 60;
        const nextHour = startHour + Math.floor((startMinute + 30) / 60);
        slots.push(`${day} ${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`);
        startHour = nextHour;
        startMinute = nextMinute;
    }

    return slots;
};

// create all the possible slots
const generateAllSlots = () => {
    const days = ["L", "MA", "ME", "J", "V", "S"];
    const allSlots = [];
    days.forEach(day => {
        const openingHour = day === "S" ? 8 : 8;
        const closingHour = day === "S" ? 12 : 22;

        for (let hour = openingHour; hour < closingHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const start = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                const endMinute = (minute + 30) % 60;
                const endHour = hour + Math.floor((minute + 30) / 60);
                const end = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
                allSlots.push(`${day} ${start}-${end}`);
            }
        }
    });
    return allSlots;
};

// find the occupied slots
const getOccupiedSlots = (parsedCourse, room) => {
    const occupiedSlots = [];
    parsedCourse.forEach(course => {
        course.timeSlots.forEach(slot => {
            if (slot.salle === room) {
                occupiedSlots.push(...splitInto30MinuteSlots(slot.horaire.split(' ')[0], slot.horaire.split(' ')[1]));
            }
        });
    });
    return occupiedSlots;
};

module.exports = {
    generateAllSlots,
    getOccupiedSlots,
};