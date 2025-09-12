// Calendar JavaScript for Attendance Management System

// Arabic month names
const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Arabic day names
const arabicDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

// Global calendar variables
let currentCalendarDate = new Date();
let today = new Date();

// Public holidays (example dates - can be customized)
const publicHolidays = [
    { date: '2025-01-01', name: 'رأس السنة الميلادية' },
    { date: '2025-01-25', name: 'ثورة 25 يناير' },
    { date: '2025-03-22', name: 'عيد الأم' },
    { date: '2025-04-25', name: 'تحرير سيناء' },
    { date: '2025-05-01', name: 'عيد العمال' },
    { date: '2025-07-23', name: 'ثورة 23 يوليو' },
    { date: '2025-10-06', name: 'انتصارات أكتوبر' }
];

// Special events for the calendar
const specialEvents = {
    '2025-09-11': [
        { title: 'اجتماع فريق العمل', time: '10:00', type: 'meeting' },
        { title: 'مراجعة المشاريع', time: '14:00', type: 'review' }
    ],
    '2025-09-15': [
        { title: 'تدريب الموظفين', time: '09:00', type: 'training' }
    ],
    '2025-09-20': [
        { title: 'اجتماع الإدارة', time: '11:00', type: 'meeting' }
    ]
};

// Initialize calendar when document is ready
$(document).ready(function() {
    initializeCalendar();
    setupEventListeners();
});

// Initialize the calendar
function initializeCalendar() {
    updateCalendarTitle();
    renderCalendar();
}

// Setup event listeners
function setupEventListeners() {
    $('#prevMonth').on('click', function() {
        navigateMonth(-1);
    });

    $('#nextMonth').on('click', function() {
        navigateMonth(1);
    });

    $('#todayBtn').on('click', function() {
        goToToday();
    });

    // Keyboard navigation
    $(document).on('keydown', function(e) {
        switch(e.key) {
            case 'ArrowLeft':
                navigateMonth(1);
                break;
            case 'ArrowRight':
                navigateMonth(-1);
                break;
            case 'Home':
                goToToday();
                break;
        }
    });
}

// Navigate months
function navigateMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    updateCalendarTitle();
    renderCalendar();
    
    // Add smooth transition effect
    $('#calendar').addClass('calendar-fade-in');
    setTimeout(() => {
        $('#calendar').removeClass('calendar-fade-in');
    }, 500);
}

// Go to today's date
function goToToday() {
    currentCalendarDate = new Date();
    updateCalendarTitle();
    renderCalendar();
    
    // Highlight today with special effect
    setTimeout(() => {
        $('.calendar-day.today').css('animation', 'todayPulse 0.5s ease-in-out 3');
    }, 100);
}

// Update calendar title
function updateCalendarTitle() {
    const monthName = arabicMonths[currentCalendarDate.getMonth()];
    const year = currentCalendarDate.getFullYear();
    $('#calendarTitle').text(`${monthName} ${year}`);
}

// Render the calendar
function renderCalendar() {
    const calendar = $('#calendar');
    calendar.empty();

    // Create calendar grid
    const calendarGrid = $('<div class="calendar-grid"></div>');

    // Add day headers
    arabicDays.forEach(day => {
        calendarGrid.append(`<div class="calendar-header">${day}</div>`);
    });

    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get first day of week (Saturday = 0 in Arabic calendar)
    let startDay = (firstDay.getDay() + 1) % 7;

    // Add previous month's trailing days
    const prevMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        const dayElement = createCalendarDay(dayNum, 'other-month');
        calendarGrid.append(dayElement);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createCalendarDay(day, 'current-month');
        calendarGrid.append(dayElement);
    }

    // Add next month's leading days to fill the grid
    const totalCells = calendarGrid.children('.calendar-day').length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createCalendarDay(day, 'other-month');
        calendarGrid.append(dayElement);
    }

    calendar.append(calendarGrid);
}

// Create a calendar day element
function createCalendarDay(dayNumber, monthType) {
    const dayElement = $('<div class="calendar-day"></div>');
    
    // Create date object for this day
    let dayDate;
    if (monthType === 'current-month') {
        dayDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), dayNumber);
    } else if (monthType === 'other-month') {
        if (dayNumber < 15) {
            // Next month
            dayDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, dayNumber);
        } else {
            // Previous month
            dayDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, dayNumber);
        }
    }

    // Add day number
    dayElement.append(`<span class="calendar-day-number">${dayNumber}</span>`);

    // Add month type class
    dayElement.addClass(monthType);

    // Check if it's today
    if (isToday(dayDate)) {
        dayElement.addClass('today');
        dayElement.append('<span class="calendar-day-type">اليوم</span>');
    } else {
        // Determine day type
        const dayType = getDayType(dayDate);
        dayElement.addClass(dayType);
        
        switch(dayType) {
            case 'weekend':
                dayElement.append('<span class="calendar-day-type">عطلة</span>');
                break;
            case 'holiday':
                const holiday = getHoliday(dayDate);
                dayElement.append(`<span class="calendar-day-type">${holiday.name}</span>`);
                break;
            case 'workday':
                dayElement.append('<span class="calendar-day-type">عمل</span>');
                break;
        }
    }

    // Check for special events
    const dateString = formatDateString(dayDate);
    if (specialEvents[dateString]) {
        dayElement.addClass('has-events');
    }

    // Add click event
    dayElement.on('click', function() {
        showDateInfo(dayDate, specialEvents[dateString] || []);
    });

    return dayElement;
}

// Check if date is today
function isToday(date) {
    return date.toDateString() === today.toDateString();
}

// Get day type (weekend, holiday, workday)
function getDayType(date) {
    const dayOfWeek = date.getDay();
    
    // Check if it's a holiday
    if (isHoliday(date)) {
        return 'holiday';
    }
    
    // Check if it's weekend (Friday or Saturday in Arabic context)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
        return 'weekend';
    }
    
    return 'workday';
}

// Check if date is a holiday
function isHoliday(date) {
    const dateString = formatDateString(date);
    return publicHolidays.some(holiday => holiday.date === dateString);
}

// Get holiday info
function getHoliday(date) {
    const dateString = formatDateString(date);
    return publicHolidays.find(holiday => holiday.date === dateString);
}

// Format date to string (YYYY-MM-DD)
function formatDateString(date) {
    return date.toISOString().split('T')[0];
}

// Show date information modal
function showDateInfo(date, events) {
    const modal = new bootstrap.Modal(document.getElementById('dateInfoModal'));
    
    // Format date info
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const dateString = date.toLocaleDateString('ar-EG', options);
    
    $('#selectedDateInfo').html(`
        <p><strong>التاريخ:</strong> ${dateString}</p>
        <p><strong>نوع اليوم:</strong> ${getArabicDayType(date)}</p>
        ${isHoliday(date) ? `<p><strong>العطلة:</strong> ${getHoliday(date).name}</p>` : ''}
    `);
    
    // Show events
    const eventsContainer = $('#dateEvents');
    if (events.length > 0) {
        let eventsHtml = '';
        events.forEach(event => {
            const eventIcon = getEventIcon(event.type);
            eventsHtml += `
                <div class="mb-2 p-2 border-start border-primary border-3">
                    <strong>${eventIcon} ${event.title}</strong><br>
                    <small class="text-muted">الوقت: ${event.time}</small>
                </div>
            `;
        });
        eventsContainer.html(eventsHtml);
    } else {
        eventsContainer.html('<p class="text-muted">لا توجد أحداث مجدولة</p>');
    }
    
    modal.show();
}

// Get Arabic day type
function getArabicDayType(date) {
    const dayType = getDayType(date);
    switch(dayType) {
        case 'weekend': return 'عطلة نهاية الأسبوع';
        case 'holiday': return 'عطلة رسمية';
        case 'workday': return 'يوم عمل';
        default: return 'يوم عادي';
    }
}

// Get event icon
function getEventIcon(type) {
    switch(type) {
        case 'meeting': return '<i class="fas fa-users text-primary"></i>';
        case 'training': return '<i class="fas fa-graduation-cap text-success"></i>';
        case 'review': return '<i class="fas fa-clipboard-check text-warning"></i>';
        default: return '<i class="fas fa-calendar-alt text-info"></i>';
    }
}

// Add swipe gestures for mobile
let touchStartX = 0;
let touchEndX = 0;

$('#calendar').on('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

$('#calendar').on('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left (next month in RTL)
            navigateMonth(-1);
        } else {
            // Swipe right (previous month in RTL)
            navigateMonth(1);
        }
    }
}

// Auto-refresh today highlighting at midnight
function setupMidnightRefresh() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
        today = new Date();
        renderCalendar();
        setupMidnightRefresh(); // Setup for next day
    }, msUntilMidnight);
}

// Initialize midnight refresh
setupMidnightRefresh();
