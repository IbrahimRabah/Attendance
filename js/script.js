// Attendance Management System JavaScript

// Global variables
let employees = [];
let currentMonth = new Date();
let filteredEmployees = [];
let currentWeek = 0;
let isAbsentFilterActive = false; // Track if absent filter is active

// Days of the week in Arabic
const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// Initialize the application
$(document).ready(function() {
    console.log('Application initializing...');
    
    console.log('User authenticated, continuing initialization...');
    
    // Display current user info
    displayUserInfo();
    
    // Setup logout functionality
    setupLogout();
    
    initializeDatePicker();
    loadLocationsFromStorage();
    loadEmployeesFromStorage();
    console.log('Employees loaded:', employees.length);
    updateLocationDropdowns();
    displayCurrentDate();
    setCurrentWeekBasedOnToday();
    renderWeekPagination();
    renderTable();
    updateStatistics();
    
    // Initialize employee filter
    $('#employeeFilter').on('keyup', function() {
        filterEmployeesByName();
    });
    
    // Initialize location filter
    $('#locationFilter').on('change', function() {
        filterEmployeesByName();
    });
    
    // Add click event for absent employees filter
    $('#absentCard').on('click', function() {
        toggleAbsentFilter();
    });
    
    // Set default date for advance modal
    $('#advanceDate').val(new Date().toISOString().split('T')[0]);
    
    console.log('Application initialized');

    // Month Report: Show report when modal is opened
    $('#monthReportModal').on('show.bs.modal', function () {
        generateMonthReport();
    });
});
// Generate and display the month report for all employees
function generateMonthReport() {
    const selectedLocationId = $('#reportLocationFilter').val();
    let reportEmployees = [...employees];
    
    // Filter by location if selected
    if (selectedLocationId !== '') {
        reportEmployees = reportEmployees.filter(employee => 
            employee.locationId == selectedLocationId
        );
    }
    
    let reportRows = '';
    let totalSalaries = 0;
    let totalAdvances = 0;
    let totalRemaining = 0;
    let totalAbsent = 0;

    reportEmployees.forEach(emp => {
        const monthlyStats = calculateMonthlyAttendance(emp);
        const advanceInfo = getMonthlyAdvanceWithDate(emp);
        const deductions = calculateTotalDeductions(emp);
        const remaining = calculateRemainingSalary(emp);

        reportRows += `
            <tr>
                <td>${emp.name}</td>
                <td>${emp.position || ''}</td>
                <td>${getLocationName(emp.locationId)}</td>
                <td>${emp.salary ? emp.salary.toLocaleString() : ''}</td>
                <td>${monthlyStats.absentDays}</td>
                <td>${advanceInfo.amount ? advanceInfo.amount.toLocaleString() : 0}</td>
                <td>${deductions.totalDeductions.toLocaleString()}</td>
                <td>${remaining.toLocaleString()}</td>
            </tr>
        `;
        totalSalaries += emp.salary || 0;
        totalAdvances += advanceInfo.amount || 0;
        totalRemaining += remaining;
        totalAbsent += monthlyStats.absentDays;
    });

    // Summary row
    let summaryRow = `
        <tr class="table-info fw-bold">
            <td colspan="3">الإجمالي</td>
            <td>${totalSalaries.toLocaleString()}</td>
            <td>${totalAbsent}</td>
            <td>${totalAdvances.toLocaleString()}</td>
            <td></td>
            <td>${totalRemaining.toLocaleString()}</td>
        </tr>
    `;


    // Get Arabic month name and year
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthName = months[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();

    // Title section with icon, company name, and month
    const titleHtml = `
        <div class="d-flex align-items-center mb-2">
            <img src="images/elzahp.png" alt="شعار الشركة" style="width: 48px; height: 48px; object-fit: cover; border-radius: 50%; margin-left: 12px;">
            <div>
                <h3 class="mb-0"><i class="fas fa-file-alt me-2"></i> تقرير شهر الموظفين - شركة الذهبي</h3>
                <div class="text-muted fs-5">${monthName} ${year}</div>
            </div>
        </div>
    `;

    // Table HTML with PDF button
    const tableHtml = `
        ${titleHtml}
        <div class="mb-3 text-end">
            <button class="btn btn-outline-primary" onclick="printMonthReport()">
                <i class="fas fa-file-pdf me-2"></i>حفظ التقرير كـ PDF
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered table-striped text-center align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>اسم الموظف</th>
                        <th>الوظيفة</th>
                        <th>الموقع</th>
                        <th>المرتب</th>
                        <th>أيام الغياب</th>
                        <th>السلف</th>
                        <th>إجمالي الخصم</th>
                        <th>صافي المرتب</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportRows}
                    ${summaryRow}
                </tbody>
            </table>
        </div>
    `;

    // Set content in modal
    document.getElementById('monthReportContent').innerHTML = tableHtml;
}

// Print or save the month report as PDF
function printMonthReport() {
    const printContents = document.getElementById('monthReportContent').innerHTML;
    const printWindow = window.open('', '', 'width=1000,height=800');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>تقرير شهر الموظفين</title>
            <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css' rel='stylesheet'>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>body{padding:32px;}</style>
        </head>
        <body>${printContents}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            showLogoutConfirmation(
                'تسجيل الخروج',
                'هل أنت متأكد من تسجيل الخروج؟',
                'سيتم إنهاء جلسة العمل الحالية وتوجيهك إلى صفحة تسجيل الدخول.',
                () => {
                    if (window.AttendanceAuth) {
                        window.AttendanceAuth.logout();
                    } else {
                        // Fallback if auth system is not available
                        localStorage.clear();
                        window.location.href = 'login.html';
                    }
                }
            );
        });
    }
}

// Display current user information
function displayUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && window.AttendanceAuth) {
        const currentUser = window.AttendanceAuth.getCurrentUser();
        if (currentUser && currentUser.email) {
            // Extract name from email (before @)
            const userName = currentUser.email.split('@')[0];
            userNameElement.textContent = `مرحباً، ${userName}`;
        }
    }
}

// Initialize Bootstrap Datepicker
function initializeDatePicker() {
    $('#monthPicker').datepicker({
        format: 'mm/yyyy',
        startView: 'months',
        minViewMode: 'months',
        language: 'ar',
        autoclose: true,
        todayHighlight: true
    }).on('changeDate', function(e) {
        currentMonth = e.date;
        setCurrentWeekBasedOnToday();
        renderWeekPagination();
        renderTable();
        updateStatistics();
    });
    
    // Set initial value to current month
    $('#monthPicker').datepicker('setDate', currentMonth);
}

// Display current date
function displayCurrentDate() {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const dateString = new Date().toLocaleDateString('ar-EG', options);
    $('#currentDate').text(dateString);
}

// Load employees from localStorage
function loadEmployeesFromStorage() {
    const stored = localStorage.getItem('attendanceEmployees');
    if (stored) {
        employees = JSON.parse(stored);
        
        // Migration: Add default location to existing employees
        let needsSave = false;
        employees.forEach(employee => {
            if (!employee.locationId) {
                employee.locationId = 1; // Assign to default location
                needsSave = true;
            }
        });
        
        if (needsSave) {
            saveEmployeesToStorage();
        }
    } else {
        // Initialize with sample data
        employees = [
            {
                id: 1,
                name: 'أحمد محمد علي',
                position: 'مطور ويب',
                salary: 5000,
                locationId: 1,
                advance: 500,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 2,
                name: 'فاطمة أحمد حسن',
                position: 'مصممة جرافيك',
                salary: 4500,
                locationId: 1,
                advance: 300,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 3,
                name: 'محمد عبد الله إبراهيم',
                position: 'مدير مشروع',
                salary: 6000,
                locationId: 1,
                advance: 800,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 4,
                name: 'نور الدين خالد',
                position: 'محاسب',
                salary: 4000,
                locationId: 1,
                advance: 200,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 5,
                name: 'مريم سعد الدين',
                position: 'مطورة تطبيقات',
                salary: 5500,
                locationId: 1,
                advance: 600,
                advanceDate: '2025-09-01',
                attendance: {}
            }
        ];
        saveEmployeesToStorage();
    }
    filteredEmployees = [...employees];
}

// Save employees to localStorage
function saveEmployeesToStorage() {
    localStorage.setItem('attendanceEmployees', JSON.stringify(employees));
}

// Location Management Functions
let locations = [];

// Load locations from localStorage
function loadLocationsFromStorage() {
    const stored = localStorage.getItem('attendanceLocations');
    if (stored) {
        locations = JSON.parse(stored);
    } else {
        // Initialize with default location
        locations = [
            { id: 1, name: 'المكتب الرئيسي' }
        ];
        saveLocationsToStorage();
    }
}

// Save locations to localStorage
function saveLocationsToStorage() {
    localStorage.setItem('attendanceLocations', JSON.stringify(locations));
}

// Add new location
function addLocation() {
    const locationName = $('#locationName').val().trim();
    const password = $('#locationPassword').val();
    
    if (!locationName) {
        showNotification('يرجى إدخال اسم الموقع', 'danger');
        return;
    }
    
    if (password !== 'Moumen@') {
        showNotification('كلمة المرور غير صحيحة', 'danger');
        return;
    }
    
    // Check if location already exists
    if (locations.some(loc => loc.name === locationName)) {
        showNotification('هذا الموقع موجود بالفعل', 'warning');
        return;
    }
    
    const newLocation = {
        id: Date.now(),
        name: locationName,
        dateAdded: new Date().toISOString()
    };
    
    locations.push(newLocation);
    saveLocationsToStorage();
    updateLocationDropdowns();
    
    // Reset form and close modal
    $('#addLocationForm')[0].reset();
    $('#addLocationModal').modal('hide');
    
    showNotification('تم إضافة الموقع بنجاح', 'success');
}

// Update location dropdowns in employee forms
function updateLocationDropdowns() {
    const addLocationSelect = $('#employeeLocation');
    const editLocationSelect = $('#editEmployeeLocation');
    const locationFilterSelect = $('#locationFilter');
    const reportLocationFilterSelect = $('#reportLocationFilter');
    
    // Clear existing options except the first one
    addLocationSelect.find('option:not(:first)').remove();
    editLocationSelect.find('option:not(:first)').remove();
    locationFilterSelect.find('option:not(:first)').remove();
    reportLocationFilterSelect.find('option:not(:first)').remove();
    
    // Add location options
    locations.forEach(location => {
        const option = `<option value="${location.id}">${location.name}</option>`;
        addLocationSelect.append(option);
        editLocationSelect.append(option);
        locationFilterSelect.append(option);
        reportLocationFilterSelect.append(option);
    });
}

// Get location name by ID
function getLocationName(locationId) {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'غير محدد';
}

// Clear report filter
function clearReportFilter() {
    $('#reportLocationFilter').val('');
    generateMonthReport();
    showNotification('تم مسح فلتر التقرير', 'success');
}

// Generate attendance key for specific date
function getAttendanceKey(date, dayIndex) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Get weeks in the current month
function getWeeksInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Find the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Find the first Saturday of the week containing the 1st of the month
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sunday, 6=Saturday
    const firstSaturday = new Date(firstDayOfMonth);
    
    // Calculate how many days to go back to reach Saturday
    // Saturday=6, so if first day is Sunday(0), go back 1 day
    // If first day is Monday(1), go back 2 days, etc.
    const daysToGoBack = firstDayOfWeek === 6 ? 0 : (firstDayOfWeek === 0 ? 1 : firstDayOfWeek + 1);
    firstSaturday.setDate(firstSaturday.getDate() - daysToGoBack);
    
    // Find the last day we need to include (complete the last week)
    const lastDayOfWeek = lastDayOfMonth.getDay();
    const lastThursday = new Date(lastDayOfMonth);
    
    // Calculate how many days to go forward to reach Thursday (end of our work week)
    // Thursday=4, if last day is Thursday(4), no need to go forward
    // If last day is Friday(5), go back 1 day, if Saturday(6), go back 2 days
    // If last day is Sunday(0), go forward 4 days, Monday(1) go forward 3 days, etc.
    let daysToGoForward;
    if (lastDayOfWeek <= 4) {
        daysToGoForward = 4 - lastDayOfWeek; // Go forward to Thursday
    } else {
        daysToGoForward = 4 + (7 - lastDayOfWeek); // Go to next week's Thursday
    }
    lastThursday.setDate(lastThursday.getDate() + daysToGoForward);
    
    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(firstSaturday);
    
    // Generate weeks from first Saturday to last Thursday
    while (currentDate <= lastThursday) {
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
        
        // Convert to our week structure (Saturday=0, Sunday=1, ..., Thursday=5)
        const ourDayIndex = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
        
        // Start new week on Saturday (ourDayIndex = 0)
        if (ourDayIndex === 0 && currentWeek.length > 0) {
            // Only include weeks that have at least one day from the current month
            const weekHasCurrentMonthDay = currentWeek.some(d => d.getMonth() === month);
            if (weekHasCurrentMonthDay) {
                weeks.push([...currentWeek]);
            }
            currentWeek = [];
        }
        
        // Only include weekdays (Saturday to Thursday, ourDayIndex 0-5)
        if (ourDayIndex <= 5) {
            currentWeek.push(new Date(currentDate));
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Push the last week if it has days from the current month
    if (currentWeek.length > 0) {
        const weekHasCurrentMonthDay = currentWeek.some(d => d.getMonth() === month);
        if (weekHasCurrentMonthDay) {
            weeks.push([...currentWeek]);
        }
    }
    
    return weeks;
}

// Set current week based on today's date
function setCurrentWeekBasedOnToday() {
    const today = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    // Only set current week if we're viewing the current month
    if (today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex) {
        const weeks = getWeeksInMonth(currentMonth);
        
        // Find which week contains today
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            for (let j = 0; j < week.length; j++) {
                const weekDay = week[j];
                if (weekDay.getDate() === today.getDate() && 
                    weekDay.getMonth() === today.getMonth() && 
                    weekDay.getFullYear() === today.getFullYear()) {
                    currentWeek = i;
                    return;
                }
            }
        }
    }
    
    // If not current month or today not found, default to first week
    currentWeek = 0;
}

// Render week pagination
function renderWeekPagination() {
    const weekPagination = $('#weekPagination');
    weekPagination.empty();
    
    const weeks = getWeeksInMonth(currentMonth);
    const today = new Date();
    
    // Find which week contains today (if current month)
    let todayWeekIndex = -1;
    if (today.getFullYear() === currentMonth.getFullYear() && 
        today.getMonth() === currentMonth.getMonth()) {
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            for (let j = 0; j < week.length; j++) {
                const weekDay = week[j];
                if (weekDay.getDate() === today.getDate()) {
                    todayWeekIndex = i;
                    break;
                }
            }
            if (todayWeekIndex !== -1) break;
        }
    }
    
    // Ensure we always show 5 weeks (maximum possible in a month)
    const maxWeeks = 5;
    const weeksToShow = Math.max(weeks.length, maxWeeks);
    
    if (weeks.length === 0) {
        weekPagination.append(`
            <span class="text-muted">لا توجد أسابيع</span>
        `);
        return;
    }
    
    for (let index = 0; index < weeksToShow; index++) {
        const week = weeks[index];
        let weekLabel = `الأسبوع ${index + 1}`;
        let title = '';
        
        if (week && week.length > 0) {
            const firstDay = week[0];
            const lastDay = week[week.length - 1];
            title = `${firstDay.getDate()}/${firstDay.getMonth() + 1} - ${lastDay.getDate()}/${lastDay.getMonth() + 1}`;
        } else {
            // If week doesn't exist, still show the button but disabled
            weekLabel = `الأسبوع ${index + 1}`;
            title = 'لا توجد أيام في هذا الأسبوع';
        }
        
        const isActive = index === currentWeek ? 'active' : '';
        const isDisabled = !week || week.length === 0 ? 'disabled' : '';
        const isTodayWeek = index === todayWeekIndex ? 'today-week' : '';
        
        const button = $(`
            <button type="button" class="btn btn-outline-primary btn-sm ${isActive} ${isDisabled} ${isTodayWeek}" 
                    onclick="selectWeek(${index})" title="${title}" ${isDisabled ? 'disabled' : ''}>
                ${weekLabel}
                ${index === todayWeekIndex ? '<i class="fas fa-calendar-day ms-1"></i>' : ''}
            </button>
        `);
        
        weekPagination.append(button);
    }
}

// Select specific week
function selectWeek(weekIndex) {
    const weeks = getWeeksInMonth(currentMonth);
    
    // Only select the week if it exists and has days
    if (weekIndex >= 0 && weekIndex < weeks.length && weeks[weekIndex] && weeks[weekIndex].length > 0) {
        currentWeek = weekIndex;
        renderWeekPagination();
        renderTable();
    }
}

// Calculate attendance statistics for an employee in current month
function calculateMonthlyAttendance(employee) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let presentDays = 0;
    let absentDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        
        // Skip Fridays (5) - assuming Friday is the weekend
        if (dayOfWeek === 5) continue;
        
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to our indexing
        const attendanceKey = getAttendanceKey(date, dayIndex);
        const status = employee.attendance[attendanceKey];
        
        if (status === 'present') {
            presentDays++;
        } else if (status === 'absent') {
            absentDays++;
        }
    }
    
    return { presentDays, absentDays };
}

// Get advance with date for current month
function getMonthlyAdvanceWithDate(employee) {
    // Migration: Convert old single advance to new array format
    if (employee.advance !== undefined && !employee.advances) {
        employee.advances = employee.advance > 0 ? [{
            amount: employee.advance,
            date: employee.advanceDate || new Date().toISOString().split('T')[0],
            id: Date.now()
        }] : [];
        delete employee.advance;
        delete employee.advanceDate;
    }
    
    // Ensure advances array exists
    if (!employee.advances) {
        employee.advances = [];
    }
    
    // Calculate total advances for current month
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    let totalAmount = 0;
    let latestDate = '';
    
    employee.advances.forEach(advance => {
        const advanceDate = new Date(advance.date);
        if (advanceDate.getFullYear() === currentYear && advanceDate.getMonth() === currentMonthIndex) {
            totalAmount += advance.amount;
            if (!latestDate || advanceDate > new Date(latestDate)) {
                latestDate = advance.date;
            }
        }
    });
    
    const dateStr = latestDate ? new Date(latestDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    
    return {
        amount: totalAmount,
        date: latestDate ? dateStr : '-',
        count: employee.advances.filter(advance => {
            const advanceDate = new Date(advance.date);
            return advanceDate.getFullYear() === currentYear && advanceDate.getMonth() === currentMonthIndex;
        }).length
    };
}

// Calculate daily salary (salary divided by 30 days)
function calculateDailySalary(employee) {
    return employee.salary / 30;
}

// Calculate total deductions (absent days + advances)
function calculateTotalDeductions(employee) {
    const dailySalary = calculateDailySalary(employee);
    const monthlyStats = calculateMonthlyAttendance(employee);
    const advanceInfo = getMonthlyAdvanceWithDate(employee);
    
    // Calculate deduction for absent days
    const absentDaysDeduction = monthlyStats.absentDays * dailySalary;
    
    // Total deductions = absent days deduction + advances
    const totalDeductions = absentDaysDeduction + advanceInfo.amount;
    
    return {
        absentDaysDeduction: absentDaysDeduction,
        advancesDeduction: advanceInfo.amount,
        totalDeductions: totalDeductions
    };
}

// Calculate remaining salary
function calculateRemainingSalary(employee) {
    const deductions = calculateTotalDeductions(employee);
    const remainingSalary = employee.salary - deductions.totalDeductions;
    
    return Math.max(0, remainingSalary); // Ensure salary doesn't go negative
}

// Render the attendance table
function renderTable() {
    console.log('renderTable called');
    const tableBody = $('#attendanceTableBody');
    console.log('Table body found:', tableBody.length > 0);
    console.log('Filtered employees:', filteredEmployees.length);
    
    tableBody.empty();
    
    // Show message if no employees
    if (filteredEmployees.length === 0) {
        tableBody.append(`
            <tr>
                <td colspan="16" class="text-center text-muted py-4">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <br>
                    لا توجد بيانات موظفين لعرضها
                </td>
            </tr>
        `);
        return;
    }
    
    // Get current week days
    const weeks = getWeeksInMonth(currentMonth);
    const selectedWeek = weeks[currentWeek] || weeks[0];
    
    filteredEmployees.forEach((employee, index) => {
        const row = $('<tr>').addClass('fade-in');
        
        // Calculate monthly statistics
        const monthlyStats = calculateMonthlyAttendance(employee);
        const advanceInfo = getMonthlyAdvanceWithDate(employee);
        const deductionsInfo = calculateTotalDeductions(employee);
        const remainingSalary = calculateRemainingSalary(employee);
        
        // Employee basic info
        row.append(`
            <td class="align-middle">
                <strong>${employee.name}</strong>
            </td>
            <td class="align-middle">${employee.position}</td>
            <td class="align-middle salary-cell">
                ${employee.salary.toLocaleString()} ج.م
            </td>
            <td class="align-middle location-cell">
                <i class="fas fa-map-marker-alt me-1"></i>
                ${getLocationName(employee.locationId)}
            </td>
            <td class="align-middle text-success">
                <i class="fas fa-check-circle me-1"></i>
                ${monthlyStats.presentDays} يوم
            </td>
            <td class="align-middle text-danger">
                <i class="fas fa-times-circle me-1"></i>
                ${monthlyStats.absentDays} يوم
            </td>
            <td class="align-middle advance-cell">
                <div class="d-flex flex-column">
                    <span class="fw-bold">${advanceInfo.amount.toLocaleString()} ج.م</span>
                    <small class="text-muted">${advanceInfo.date}</small>
                    ${advanceInfo.count > 1 ? `<small class="text-info">(${advanceInfo.count} سلفة)</small>` : ''}
                    <button class="btn btn-sm btn-outline-primary mt-1" onclick="toggleAdvanceRow(${employee.id})" title="عرض/إخفاء تفاصيل السلف">
                        <i class="fas fa-chevron-down" id="advanceToggleIcon${employee.id}"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle text-warning">
                <div class="d-flex flex-column">
                    <span class="fw-bold">${deductionsInfo.totalDeductions.toLocaleString()} ج.م</span>
                    <small class="text-muted">غياب: ${deductionsInfo.absentDaysDeduction.toLocaleString()}</small>
                    <small class="text-muted">سلف: ${deductionsInfo.advancesDeduction.toLocaleString()}</small>
                </div>
            </td>
            <td class="align-middle ${remainingSalary < employee.salary * 0.5 ? 'text-danger' : 'text-success'}">
                <div class="d-flex flex-column">
                    <span class="fw-bold">${remainingSalary.toLocaleString()} ج.م</span>
                    <small class="text-muted">${((remainingSalary / employee.salary) * 100).toFixed(1)}%</small>
                </div>
            </td>
        `);
        
        // Attendance cells for the 6 weekdays
        for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
            if (selectedWeek && selectedWeek[dayIndex]) {
                const day = selectedWeek[dayIndex];
                const attendanceKey = getAttendanceKey(day, dayIndex);
                const attendanceStatus = employee.attendance[attendanceKey] || 'not-set';
                const statusIcon = getStatusIcon(attendanceStatus);
                const statusClass = getStatusClass(attendanceStatus);
                
                row.append(`
                    <td class="attendance-cell ${statusClass}" 
                        onclick="toggleAttendance(${employee.id}, '${attendanceKey}')"
                        title="تاريخ: ${day.getDate()}/${day.getMonth() + 1} - انقر للتغيير">
                        <div class="d-flex flex-column align-items-center">
                            <i class="${statusIcon} fa-lg"></i>
                            <small class="mt-1">${day.getDate()}</small>
                        </div>
                    </td>
                `);
            } else {
                // Show placeholder for days that don't exist in this week
                row.append(`
                    <td class="attendance-cell text-muted">
                        <div class="d-flex flex-column align-items-center">
                            <i class="fas fa-minus fa-lg"></i>
                            <small class="mt-1">-</small>
                        </div>
                    </td>
                `);
            }
        }
        
        // Action buttons
        row.append(`
            <td class="align-middle action-buttons no-print">
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-success" onclick="printMonthlyReport(${employee.id})" title="طباعة تفاصيل الشهر">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="addAdvanceToEmployee(${employee.id})" title="إضافة سلفة">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editEmployee(${employee.id})" title="تعديل الموظف">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${employee.id})" title="حذف الموظف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `);
        
        tableBody.append(row);
        
        // Add expandable row for advance details
        const expandableRow = $(`
            <tr id="expandableRow${employee.id}" class="collapse">
                <td colspan="15" class="p-0">
                    <div class="card border-0">
                        <div class="card-body">
                            <h6 class="card-title">تفاصيل السلف - ${employee.name}</h6>
                            <div id="advanceDetails${employee.id}">
                                <!-- Advance details will be loaded here -->
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `);
        
        tableBody.append(expandableRow);
    });
    
    console.log('Table rendered with', filteredEmployees.length, 'employees');
}

// Get status text in Arabic
function getStatusText(status) {
    const statusMap = {
        'present': 'حاضر',
        'absent': 'غائب',
        'not-set': 'غير محدد'
    };
    return statusMap[status] || 'غير محدد';
}

// Get status icon
function getStatusIcon(status) {
    const iconMap = {
        'present': 'fas fa-check text-success',
        'absent': 'fas fa-times text-danger',
        'not-set': 'fas fa-question text-muted'
    };
    return iconMap[status] || 'fas fa-question text-muted';
}

// Get status CSS class
function getStatusClass(status) {
    const classMap = {
        'present': 'table-success',
        'absent': 'table-danger',
        'not-set': ''
    };
    return classMap[status] || '';
}

// Toggle attendance status
function toggleAttendance(employeeId, attendanceKey) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const currentStatus = employee.attendance[attendanceKey] || 'not-set';
    let newStatus;
    
    switch (currentStatus) {
        case 'not-set':
            newStatus = 'present';
            break;
        case 'present':
            newStatus = 'absent';
            break;
        case 'absent':
            newStatus = 'not-set';
            break;
        default:
            newStatus = 'present';
    }
    
    employee.attendance[attendanceKey] = newStatus;
    saveEmployeesToStorage();
    renderTable();
    updateStatistics();
    
    // Show feedback
    showNotification(`تم تحديث حالة الحضور إلى: ${getStatusText(newStatus)}`, 'success');
}

// Add new employee
function addEmployee() {
    const name = $('#employeeName').val().trim();
    const position = $('#employeePosition').val().trim();
    const salary = parseFloat($('#employeeSalary').val()) || 0;
    const locationId = parseInt($('#employeeLocation').val()) || null;
    const advance = parseFloat($('#employeeAdvance').val()) || 0;
    const advanceDate = $('#employeeAdvanceDate').val();
    
    if (!name || !position || salary <= 0 || !locationId) {
        showNotification('يرجى ملء جميع الحقول المطلوبة بما في ذلك الموقع', 'danger');
        return;
    }
    
    // Create advances array with initial advance if provided
    const advances = [];
    if (advance > 0) {
        advances.push({
            amount: advance,
            date: advanceDate || new Date().toISOString().split('T')[0],
            id: Date.now()
        });
    }
    
    const newEmployee = {
        id: Date.now(),
        name: name,
        position: position,
        salary: salary,
        locationId: locationId,
        advances: advances,
        attendance: {}
    };
    
    employees.push(newEmployee);
    filteredEmployees = [...employees];
    saveEmployeesToStorage();
    renderWeekPagination();
    renderTable();
    updateStatistics();
    
    // Reset form and close modal
    $('#addEmployeeForm')[0].reset();
    $('#addEmployeeModal').modal('hide');
    
    showNotification('تم إضافة الموظف بنجاح', 'success');
}

// Edit employee
function editEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    // Migration: Convert old single advance to new array format
    if (employee.advance !== undefined && !employee.advances) {
        employee.advances = employee.advance > 0 ? [{
            amount: employee.advance,
            date: employee.advanceDate || new Date().toISOString().split('T')[0],
            id: Date.now()
        }] : [];
        delete employee.advance;
        delete employee.advanceDate;
    }
    
    $('#editEmployeeId').val(employee.id);
    $('#editEmployeeName').val(employee.name);
    $('#editEmployeePosition').val(employee.position);
    $('#editEmployeeSalary').val(employee.salary);
    $('#editEmployeeLocation').val(employee.locationId || '');
    
    // For backwards compatibility, show the latest advance
    const latestAdvance = employee.advances && employee.advances.length > 0 ? 
        employee.advances[employee.advances.length - 1] : { amount: 0, date: new Date().toISOString().split('T')[0] };
    
    $('#editEmployeeAdvance').val(latestAdvance.amount);
    $('#editEmployeeAdvanceDate').val(latestAdvance.date);
    
    $('#editEmployeeModal').modal('show');
}

// Update employee
function updateEmployee() {
    const employeeId = parseInt($('#editEmployeeId').val());
    const name = $('#editEmployeeName').val().trim();
    const position = $('#editEmployeePosition').val().trim();
    const salary = parseFloat($('#editEmployeeSalary').val()) || 0;
    const locationId = parseInt($('#editEmployeeLocation').val()) || null;
    const advance = parseFloat($('#editEmployeeAdvance').val()) || 0;
    const advanceDate = $('#editEmployeeAdvanceDate').val();
    
    if (!name || !position || salary <= 0 || !locationId) {
        showNotification('يرجى ملء جميع الحقول المطلوبة بما في ذلك الموقع', 'danger');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee.name = name;
        employee.position = position;
        employee.salary = salary;
        employee.locationId = locationId;
        
        // Migration: Convert old single advance to new array format
        if (employee.advance !== undefined && !employee.advances) {
            employee.advances = employee.advance > 0 ? [{
                amount: employee.advance,
                date: employee.advanceDate || new Date().toISOString().split('T')[0],
                id: Date.now()
            }] : [];
            delete employee.advance;
            delete employee.advanceDate;
        }
        
        // Ensure advances array exists
        if (!employee.advances) {
            employee.advances = [];
        }
        
        // Update the latest advance if provided
        if (advance > 0) {
            if (employee.advances.length > 0) {
                // Update the latest advance
                employee.advances[employee.advances.length - 1] = {
                    amount: advance,
                    date: advanceDate || new Date().toISOString().split('T')[0],
                    id: employee.advances[employee.advances.length - 1].id || Date.now()
                };
            } else {
                // Add new advance
                employee.advances.push({
                    amount: advance,
                    date: advanceDate || new Date().toISOString().split('T')[0],
                    id: Date.now()
                });
            }
        }
        
        saveEmployeesToStorage();
        
        // Update filtered employees if needed
        const filteredIndex = filteredEmployees.findIndex(emp => emp.id === employeeId);
        if (filteredIndex !== -1) {
            filteredEmployees[filteredIndex] = employee;
        }
        
        renderWeekPagination();
        renderTable();
        updateStatistics();
        
        $('#editEmployeeModal').modal('hide');
        showNotification('تم تحديث بيانات الموظف بنجاح', 'success');
    }
}

// Delete employee
function deleteEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    const employeeName = employee ? employee.name : 'الموظف';
    
    showDeleteConfirmation(
        'حذف الموظف',
        `هل أنت متأكد من حذف الموظف "${employeeName}"؟`,
        'سيتم حذف جميع بيانات الحضور الخاصة به ولا يمكن التراجع عن هذا الإجراء.',
        () => {
            employees = employees.filter(emp => emp.id !== employeeId);
            filteredEmployees = filteredEmployees.filter(emp => emp.id !== employeeId);
            
            saveEmployeesToStorage();
            renderWeekPagination();
            renderTable();
            updateStatistics();
            
            showNotification('تم حذف الموظف بنجاح', 'success');
        }
    );
}

// Filter employees by name
function filterEmployeesByName() {
    const searchTerm = $('#employeeFilter').val().trim().toLowerCase();
    const selectedLocationId = $('#locationFilter').val();
    
    let filtered = [...employees];
    
    // Filter by search term
    if (searchTerm !== '') {
        filtered = filtered.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.position.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by location
    if (selectedLocationId !== '') {
        filtered = filtered.filter(employee => 
            employee.locationId == selectedLocationId
        );
    }
    
    filteredEmployees = filtered;
    
    // Apply absent filter if active
    if (isAbsentFilterActive) {
        applyAbsentFilter();
    }
    
    renderTable();
    updateStatistics();
}

// Toggle absent employees filter
function toggleAbsentFilter() {
    isAbsentFilterActive = !isAbsentFilterActive;
    
    if (isAbsentFilterActive) {
        // Apply absent filter
        applyAbsentFilter();
        $('#absentCard').addClass('border-3 border-danger');
        showNotification('تم تطبيق فلتر الغائبين', 'info');
    } else {
        // Remove absent filter
        filterEmployeesByName(); // This will reset to normal filtering
        $('#absentCard').removeClass('border-3 border-danger');
        showNotification('تم إلغاء فلتر الغائبين', 'info');
    }
}

// Apply absent filter to current filtered employees
function applyAbsentFilter() {
    const today = new Date();
    const todayKey = getAttendanceKey(today, today.getDay() === 0 ? 6 : today.getDay() - 1);
    
    filteredEmployees = filteredEmployees.filter(employee => {
        const todayAttendance = employee.attendance[todayKey];
        return todayAttendance === 'absent';
    });
    
    renderTable();
    updateStatistics();
}

// Apply filters
function filterData() {
    filterEmployeesByName();
    showNotification('تم تطبيق الفلاتر بنجاح', 'success');
}

// Clear all filters
function clearFilters() {
    $('#employeeFilter').val('');
    $('#locationFilter').val('');
    $('#monthPicker').datepicker('setDate', new Date());
    currentMonth = new Date();
    setCurrentWeekBasedOnToday();
    filteredEmployees = [...employees];
    
    // Reset absent filter
    isAbsentFilterActive = false;
    $('#absentCard').removeClass('border-3 border-danger');
    
    renderWeekPagination();
    renderTable();
    updateStatistics();
    showNotification('تم مسح جميع الفلاتر', 'success');
}

// Update statistics
function updateStatistics() {
    const totalEmployees = filteredEmployees.length;
    $('#totalEmployees').text(totalEmployees);
    
    // Calculate today's attendance
    const today = new Date();
    const todayKey = getAttendanceKey(today, today.getDay() === 0 ? 6 : today.getDay() - 1);
    
    let presentToday = 0;
    let absentToday = 0;
    let totalAdvances = 0;
    let totalSalaries = 0;
    
    filteredEmployees.forEach(employee => {
        const todayAttendance = employee.attendance[todayKey];
        if (todayAttendance === 'present') {
            presentToday++;
        } else if (todayAttendance === 'absent') {
            absentToday++;
        }
        
        // Migration: Convert old single advance to new array format
        if (employee.advance !== undefined && !employee.advances) {
            employee.advances = employee.advance > 0 ? [{
                amount: employee.advance,
                date: employee.advanceDate || new Date().toISOString().split('T')[0],
                id: Date.now()
            }] : [];
            delete employee.advance;
            delete employee.advanceDate;
        }
        
        // Calculate total advances for current month
        if (employee.advances && Array.isArray(employee.advances)) {
            const currentYear = currentMonth.getFullYear();
            const currentMonthIndex = currentMonth.getMonth();
            
            employee.advances.forEach(advance => {
                const advanceDate = new Date(advance.date);
                if (advanceDate.getFullYear() === currentYear && advanceDate.getMonth() === currentMonthIndex) {
                    totalAdvances += advance.amount || 0;
                }
            });
        } else {
            // Fallback for legacy data
            totalAdvances += employee.advance || 0;
        }
        
        // Calculate remaining salary for this employee using the same function as the table
        const remainingSalary = calculateRemainingSalary(employee);
        totalSalaries += remainingSalary;
    });
    
    $('#presentToday').text(presentToday);
    $('#absentToday').text(absentToday);
    $('#totalAdvances').text(totalAdvances.toLocaleString() + ' ج.م');
    $('#totalSalaries').text(totalSalaries.toLocaleString() + ' ج.م');
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    $('.notification').remove();
    
    const notification = $(`
        <div class="alert alert-${type} notification position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 300px;">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'danger' ? 'times' : 'info'}-circle me-2"></i>
            ${message}
        </div>
    `);
    
    $('body').append(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.fadeOut(() => notification.remove());
    }, 3000);
}

// Export data to JSON
function exportData() {
    const dataStr = JSON.stringify(employees, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

// Import data from JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                employees = importedData;
                filteredEmployees = [...employees];
                saveEmployeesToStorage();
                renderWeekPagination();
                renderTable();
                updateStatistics();
                showNotification('تم استيراد البيانات بنجاح', 'success');
            } else {
                showNotification('تنسيق الملف غير صحيح', 'danger');
            }
        } catch (error) {
            showNotification('خطأ في قراءة الملف', 'danger');
        }
    };
    reader.readAsText(file);
}

// Print attendance report
function printReport() {
    window.print();
}

// Keyboard shortcuts
$(document).keydown(function(e) {
    // Ctrl+N: Add new employee
    if (e.ctrlKey && e.which === 78) {
        e.preventDefault();
        $('#addEmployeeModal').modal('show');
    }
    
    // Ctrl+F: Focus on search
    if (e.ctrlKey && e.which === 70) {
        e.preventDefault();
        $('#employeeFilter').focus();
    }
    
    // Escape: Close modals
    if (e.which === 27) {
        $('.modal').modal('hide');
    }
});

// Clear all data
function clearAllData() {
    showDeleteConfirmation(
        'حذف جميع البيانات',
        'هل أنت متأكد من حذف جميع البيانات؟',
        'سيتم حذف جميع الموظفين وبيانات الحضور ولا يمكن التراجع عن هذا الإجراء.',
        () => {
            localStorage.removeItem('attendanceEmployees');
            employees = [];
            filteredEmployees = [];
            renderWeekPagination();
            renderTable();
            updateStatistics();
            showNotification('تم حذف جميع البيانات', 'success');
        }
    );
}

// Custom Delete Confirmation Modal
function showDeleteConfirmation(title, message, description, onConfirm) {
    // Remove existing modal if any
    $('#deleteConfirmationModal').remove();
    
    const modalHtml = `
        <div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-labelledby="deleteConfirmationModalLabel" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content delete-confirmation-modal">
                    <div class="modal-header border-0 pb-0">
                        <div class="delete-icon-container">
                            <div class="delete-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center px-4 pb-4">
                        <h4 class="modal-title text-danger mb-3" id="deleteConfirmationModalLabel">${title}</h4>
                        <p class="fs-5 mb-2 text-dark">${message}</p>
                        <p class="text-muted small mb-4">${description}</p>
                        <div class="d-flex gap-3 justify-content-center">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                إلغاء
                            </button>
                            <button type="button" class="btn btn-danger px-4" id="confirmDeleteBtn">
                                <i class="fas fa-trash me-2"></i>
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    $('body').append(modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    modal.show();
    
    // Handle confirm button click
    $('#confirmDeleteBtn').on('click', function() {
        modal.hide();
        onConfirm();
    });
    
    // Clean up modal after it's hidden
    $('#deleteConfirmationModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

// Custom Logout Confirmation Modal
function showLogoutConfirmation(title, message, description, onConfirm) {
    // Remove existing modal if any
    $('#logoutConfirmationModal').remove();
    
    const modalHtml = `
        <div class="modal fade" id="logoutConfirmationModal" tabindex="-1" aria-labelledby="logoutConfirmationModalLabel" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content delete-confirmation-modal">
                    <div class="modal-header border-0 pb-0">
                        <div class="delete-icon-container">
                            <div class="delete-icon">
                                <i class="fas fa-sign-out-alt"></i>
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center px-4 pb-4">
                        <h4 class="modal-title text-warning mb-3" id="logoutConfirmationModalLabel">${title}</h4>
                        <p class="fs-5 mb-2 text-dark">${message}</p>
                        <p class="text-muted small mb-4">${description}</p>
                        <div class="d-flex gap-3 justify-content-center">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                إلغاء
                            </button>
                            <button type="button" class="btn btn-warning px-4" id="confirmLogoutBtn">
                                <i class="fas fa-sign-out-alt me-2"></i>
                                تسجيل الخروج
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    $('body').append(modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('logoutConfirmationModal'));
    modal.show();
    
    // Handle confirm button click
    $('#confirmLogoutBtn').on('click', function() {
        modal.hide();
        onConfirm();
    });
    
    // Clean up modal after it's hidden
    $('#logoutConfirmationModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

// Auto-save reminder
setInterval(() => {
    saveEmployeesToStorage();
}, 30000); // Save every 30 seconds

// Add advance to existing employee
function addAdvanceToEmployee(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    $('#advanceEmployeeId').val(employee.id);
    $('#advanceEmployeeName').val(employee.name);
    $('#advanceAmount').val('');
    $('#advanceDate').val(new Date().toISOString().split('T')[0]);
    $('#advanceNotes').val('');
    
    $('#addAdvanceModal').modal('show');
}

// Add new advance
function addAdvance() {
    const employeeId = parseInt($('#advanceEmployeeId').val());
    const amount = parseFloat($('#advanceAmount').val()) || 0;
    const date = $('#advanceDate').val();
    const notes = $('#advanceNotes').val().trim();
    
    if (amount <= 0) {
        showNotification('يرجى إدخال مبلغ السلفة', 'danger');
        return;
    }
    
    if (!date) {
        showNotification('يرجى اختيار تاريخ السلفة', 'danger');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        showNotification('لم يتم العثور على الموظف', 'danger');
        return;
    }
    
    // Migration: Convert old single advance to new array format
    if (employee.advance !== undefined && !employee.advances) {
        employee.advances = employee.advance > 0 ? [{
            amount: employee.advance,
            date: employee.advanceDate || new Date().toISOString().split('T')[0],
            id: Date.now() - 1000
        }] : [];
        delete employee.advance;
        delete employee.advanceDate;
    }
    
    // Ensure advances array exists
    if (!employee.advances) {
        employee.advances = [];
    }
    
    // Add new advance
    const newAdvance = {
        id: Date.now(),
        amount: amount,
        date: date,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    employee.advances.push(newAdvance);
    
    saveEmployeesToStorage();
    
    // Update filtered employees if needed
    const filteredIndex = filteredEmployees.findIndex(emp => emp.id === employeeId);
    if (filteredIndex !== -1) {
        filteredEmployees[filteredIndex] = employee;
    }
    
    renderTable();
    updateStatistics();
    
    // Refresh the expandable row if it's open
    const expandableRow = $(`#expandableRow${employeeId}`);
    if (expandableRow.hasClass('show')) {
        loadAdvanceDetailsInRow(employeeId);
    }
    
    $('#addAdvanceModal').modal('hide');
    showNotification(`تم إضافة سلفة بمبلغ ${amount.toLocaleString()} ج.م للموظف ${employee.name}`, 'success');
}

// Toggle advance row (expandable)
function toggleAdvanceRow(employeeId) {
    const expandableRow = $(`#expandableRow${employeeId}`);
    const toggleIcon = $(`#advanceToggleIcon${employeeId}`);
    
    if (expandableRow.hasClass('show')) {
        expandableRow.collapse('hide');
        toggleIcon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
    } else {
        // Load advance details into the expandable row
        loadAdvanceDetailsInRow(employeeId);
        expandableRow.collapse('show');
        toggleIcon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
    }
}

// Load advance details in expandable row
function loadAdvanceDetailsInRow(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    // Migration: Convert old single advance to new array format
    if (employee.advance !== undefined && !employee.advances) {
        employee.advances = employee.advance > 0 ? [{
            amount: employee.advance,
            date: employee.advanceDate || new Date().toISOString().split('T')[0],
            id: Date.now()
        }] : [];
        delete employee.advance;
        delete employee.advanceDate;
    }
    
    // Ensure advances array exists
    if (!employee.advances) {
        employee.advances = [];
    }
    
    // Filter advances for current month
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    const monthlyAdvances = employee.advances.filter(advance => {
        const advanceDate = new Date(advance.date);
        return advanceDate.getFullYear() === currentYear && advanceDate.getMonth() === currentMonthIndex;
    });
    
    let content = `
        <div class="row">
            <div class="col-md-8">
                <h6 class="mb-3">سلف شهر ${currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</h6>
    `;
    
    if (monthlyAdvances.length === 0) {
        content += `
                <div class="text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    لا توجد سلف في هذا الشهر
                </div>
        `;
    } else {
        content += `
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead class="table-secondary">
                            <tr>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>الملاحظات</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        monthlyAdvances.forEach(advance => {
            const formattedDate = new Date(advance.date).toLocaleDateString('ar-EG', {
                day: 'numeric',
                month: 'short'
            });
            
            content += `
                <tr>
                    <td><strong>${advance.amount.toLocaleString()} ج.م</strong></td>
                    <td>${formattedDate}</td>
                    <td>${advance.notes || '-'}</td>
                    <td>
                        <button class="btn btn-xs btn-danger" onclick="deleteAdvance(${employee.id}, ${advance.id})" title="حذف السلفة">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        content += `
                        </tbody>
                    </table>
                </div>
                <div class="mt-2 p-2 bg-light rounded">
                    <small><strong>إجمالي السلف: ${monthlyAdvances.reduce((sum, advance) => sum + advance.amount, 0).toLocaleString()} ج.م</strong></small>
                </div>
        `;
    }
    
    content += `
            </div>
            <div class="col-md-4">
                <div class="d-grid gap-2">
                    <button class="btn btn-sm btn-primary" onclick="addAdvanceToEmployee(${employee.id})">
                        <i class="fas fa-plus me-1"></i> إضافة سلفة جديدة
                    </button>
                    <button class="btn btn-sm btn-info" onclick="toggleAdvanceDetails(${employee.id})">
                        <i class="fas fa-list me-1"></i> عرض جميع السلف
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $(`#advanceDetails${employeeId}`).html(content);
}

// Toggle advance details
function toggleAdvanceDetails(employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    // Migration: Convert old single advance to new array format
    if (employee.advance !== undefined && !employee.advances) {
        employee.advances = employee.advance > 0 ? [{
            amount: employee.advance,
            date: employee.advanceDate || new Date().toISOString().split('T')[0],
            id: Date.now()
        }] : [];
        delete employee.advance;
        delete employee.advanceDate;
    }
    
    // Ensure advances array exists
    if (!employee.advances) {
        employee.advances = [];
    }
    
    // Filter advances for current month
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    const monthlyAdvances = employee.advances.filter(advance => {
        const advanceDate = new Date(advance.date);
        return advanceDate.getFullYear() === currentYear && advanceDate.getMonth() === currentMonthIndex;
    });
    
    let content = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">سلف الموظف: ${employee.name}</h6>
            <button class="btn btn-sm btn-primary" onclick="addAdvanceToEmployee(${employee.id})">
                <i class="fas fa-plus me-1"></i> إضافة سلفة جديدة
            </button>
        </div>
    `;
    
    if (monthlyAdvances.length === 0) {
        content += `
            <div class="text-center text-muted py-4">
                <i class="fas fa-money-bill-wave fa-3x mb-3"></i>
                <p>لا توجد سلف في هذا الشهر</p>
            </div>
        `;
    } else {
        content += `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>الملاحظات</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        monthlyAdvances.forEach(advance => {
            const formattedDate = new Date(advance.date).toLocaleDateString('ar-EG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            content += `
                <tr>
                    <td><strong>${advance.amount.toLocaleString()} ج.م</strong></td>
                    <td>${formattedDate}</td>
                    <td>${advance.notes || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteAdvance(${employee.id}, ${advance.id})" title="حذف السلفة">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        content += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3 p-3 bg-light rounded">
                <strong>إجمالي السلف في ${currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}: 
                ${monthlyAdvances.reduce((sum, advance) => sum + advance.amount, 0).toLocaleString()} ج.م</strong>
            </div>
        `;
    }
    
    $('#advanceDetailsContent').html(content);
    $('#advanceDetailsModal').modal('show');
}

// Delete specific advance
function deleteAdvance(employeeId, advanceId) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !employee.advances) return;
    
    const advance = employee.advances.find(adv => adv.id === advanceId);
    if (!advance) return;
    
    showDeleteConfirmation(
        'حذف السلفة',
        `هل أنت متأكد من حذف السلفة بمبلغ ${advance.amount.toLocaleString()} ج.م؟`,
        'لا يمكن التراجع عن هذا الإجراء.',
        () => {
            employee.advances = employee.advances.filter(adv => adv.id !== advanceId);
            
            saveEmployeesToStorage();
            
            // Update filtered employees if needed
            const filteredIndex = filteredEmployees.findIndex(emp => emp.id === employeeId);
            if (filteredIndex !== -1) {
                filteredEmployees[filteredIndex] = employee;
            }
            
            renderTable();
            updateStatistics();
            
            // Refresh the advance details modal if it's open
            if ($('#advanceDetailsModal').hasClass('show')) {
                toggleAdvanceDetails(employeeId);
            }
            
            // Refresh the expandable row if it's open
            const expandableRow = $(`#expandableRow${employeeId}`);
            if (expandableRow.hasClass('show')) {
                loadAdvanceDetailsInRow(employeeId);
            }
            
            showNotification('تم حذف السلفة بنجاح', 'success');
        }
    );
}

// Print Monthly Report Function
function printMonthlyReport(employeeId) {
    console.log('Printing monthly report for employee:', employeeId);
    
    // Find the employee
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        showNotification('لم يتم العثور على بيانات الموظف', 'error');
        return;
    }
    
    // Get current month info
    const monthName = getArabicMonthName(currentMonth);
    const year = currentMonth.getFullYear();
    
    // Calculate monthly statistics
    const monthlyStats = calculateMonthlyAttendance(employee);
    const advanceInfo = getMonthlyAdvanceWithDate(employee);
    const deductionsInfo = calculateTotalDeductions(employee);
    const remainingSalary = calculateRemainingSalary(employee);
    
    // Get only absent days in the month
    const daysInMonth = getDaysInMonth(currentMonth);
    let attendanceDetails = '';
    let absentDaysCount = 0;
    
    daysInMonth.forEach(day => {
        // Get the correct day index for our Arabic weekdays array
        const dayOfWeekIndex = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
        let arabicDayIndex;
        
        // Convert JavaScript day index to our Arabic days array index
        if (dayOfWeekIndex === 0) { // Sunday
            arabicDayIndex = 1; // الأحد
        } else if (dayOfWeekIndex === 1) { // Monday
            arabicDayIndex = 2; // الاثنين
        } else if (dayOfWeekIndex === 2) { // Tuesday
            arabicDayIndex = 3; // الثلاثاء
        } else if (dayOfWeekIndex === 3) { // Wednesday
            arabicDayIndex = 4; // الأربعاء
        } else if (dayOfWeekIndex === 4) { // Thursday
            arabicDayIndex = 5; // الخميس
        } else if (dayOfWeekIndex === 5) { // Friday
            arabicDayIndex = -1; // Skip Friday (weekend)
        } else if (dayOfWeekIndex === 6) { // Saturday
            arabicDayIndex = 0; // السبت
        }
        
        // Skip Fridays (weekend)
        if (arabicDayIndex === -1) return;
        
        const dayName = daysOfWeek[arabicDayIndex];
        const attendanceKey = getAttendanceKey(day, arabicDayIndex);
        const attendanceStatus = employee.attendance[attendanceKey] || 'not-set';
        
        // Show ONLY explicitly marked absent days
        if (attendanceStatus === 'absent') {
            absentDaysCount++;
            attendanceDetails += `
                <tr class="table-danger">
                    <td class="fw-bold">${day.getDate()}</td>
                    <td class="fw-bold">${dayName}</td>
                    <td class="text-danger fw-bold">
                        <i class="fas fa-times-circle me-1"></i>
                        غائب
                    </td>
                </tr>
            `;
        }
    });
    
    if (attendanceDetails === '') {
        attendanceDetails = `
            <tr>
                <td colspan="3" class="text-center text-success py-4">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <br>
                    <strong>ممتاز! لا توجد أيام غياب في هذا الشهر</strong>
                </td>
            </tr>
        `;
    }
    
    // Get advance details
    let advanceDetails = '';
    if (employee.advances && employee.advances.length > 0) {
        const monthlyAdvances = employee.advances.filter(advance => {
            const advanceDate = new Date(advance.date);
            return advanceDate.getMonth() === currentMonth.getMonth() && 
                   advanceDate.getFullYear() === currentMonth.getFullYear();
        });
        
        monthlyAdvances.forEach(advance => {
            advanceDetails += `
                <tr>
                    <td>${new Date(advance.date).toLocaleDateString('ar-EG')}</td>
                    <td>${advance.amount.toLocaleString()} ج.م</td>
                    <td>${advance.notes || '-'}</td>
                </tr>
            `;
        });
    }
    
    if (!advanceDetails) {
        advanceDetails = '<tr><td colspan="3" class="text-center text-muted">لا توجد سلف في هذا الشهر</td></tr>';
    }
    
    // Create the print content
    const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير شهري - ${employee.name}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
                
                @media print {
                    @page {
                        size: A4;
                        margin: 0.5in;
                    }
                    body { 
                        font-size: 9px !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        line-height: 1.2 !important;
                    }
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; }
                    .print-container { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        max-width: 100% !important;
                    }
                    .header-section { 
                        background: #007bff !important; 
                        -webkit-print-color-adjust: exact; 
                        color-adjust: exact;
                        padding: 0.8rem !important;
                        margin-bottom: 0.5rem !important;
                    }
                    .header-section h1 { font-size: 1.1rem !important; margin-bottom: 0.1rem !important; }
                    .header-section h3 { font-size: 0.9rem !important; margin-bottom: 0.1rem !important; }
                    .header-section p { font-size: 0.8rem !important; margin: 0 !important; }
                    .content-section { padding: 0.5rem !important; }
                    .info-card { margin-bottom: 0.5rem !important; }
                    .info-card .card-header { padding: 0.4rem !important; font-size: 0.75rem !important; }
                    .info-card .card-body { padding: 0.5rem !important; }
                    .stat-box { padding: 0.4rem !important; margin-bottom: 0.3rem !important; }
                    .stat-box h4 { font-size: 1rem !important; margin-bottom: 0.1rem !important; }
                    .stat-box p { font-size: 0.65rem !important; margin: 0 !important; }
                    .table { font-size: 0.7rem !important; }
                    .table thead th { padding: 0.3rem 0.5rem !important; font-size: 0.65rem !important; }
                    .table tbody td { padding: 0.25rem 0.5rem !important; font-size: 0.6rem !important; }
                    .section-divider { margin: 0.3rem 0 !important; height: 1px !important; }
                    .row.mb-4 { margin-bottom: 0.5rem !important; }
                    .table-container { padding: 2px !important; }
                    .employee-info-row p { margin-bottom: 0.2rem !important; font-size: 0.7rem !important; }
                    .salary-calc-row p { margin-bottom: 0.2rem !important; font-size: 0.7rem !important; }
                }
                
                * {
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 10px;
                    min-height: 100vh;
                    font-size: 10px;
                    line-height: 1.3;
                }
                
                .print-container {
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    overflow: hidden;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .header-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header-section h1 {
                    font-size: 1.4rem;
                    font-weight: 900;
                    margin-bottom: 0.2rem;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    position: relative;
                    z-index: 1;
                }
                
                .header-section h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 0.2rem;
                    position: relative;
                    z-index: 1;
                }
                
                .header-section p {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    position: relative;
                    z-index: 1;
                    margin: 0;
                }
                
                .content-section {
                    padding: 1rem;
                }
                
                .info-card {
                    border: none;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    margin-bottom: 0.8rem;
                    overflow: hidden;
                }
                
                .info-card .card-header {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-bottom: 1px solid #dee2e6;
                    font-weight: 700;
                    font-size: 0.8rem;
                    padding: 0.6rem;
                }
                
                .info-card .card-header i {
                    color: #007bff;
                    margin-left: 4px;
                }
                
                .info-card .card-body {
                    padding: 0.8rem;
                }
                
                .table-container {
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    padding: 4px;
                    background: #f8f9fa;
                }
                
                .table {
                    margin-bottom: 0;
                    font-size: 0.75rem;
                    border-collapse: separate;
                    border-spacing: 3px 0;
                }
                
                .table thead {
                    background: linear-gradient(135deg, #343a40 0%, #495057 100%);
                    color: white;
                }
                
                .table thead th {
                    border: none;
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    text-align: center;
                    position: relative;
                    border-radius: 4px;
                    margin: 0 2px;
                    font-size: 0.7rem;
                }
                
                .table tbody tr {
                    transition: background-color 0.2s ease;
                }
                
                .table tbody tr:hover {
                    background-color: rgba(0,123,255,0.05);
                }
                
                .table tbody td {
                    padding: 0.4rem 1rem;
                    border-color: #f1f3f4;
                    vertical-align: middle;
                    text-align: center;
                    border-radius: 3px;
                    margin: 0 2px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    font-size: 0.7rem;
                }
                
                .stat-box {
                    background: linear-gradient(135deg, #28a745 0%, #34ce57 100%);
                    color: white;
                    padding: 0.6rem;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 0.6rem;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
                    position: relative;
                    overflow: hidden;
                }
                
                .stat-box h4 {
                    font-size: 1.2rem;
                    font-weight: 900;
                    margin-bottom: 0.2rem;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                }
                
                .stat-box p {
                    margin: 0;
                    font-weight: 600;
                    opacity: 0.95;
                    font-size: 0.7rem;
                }
                
                .stat-danger {
                    background: linear-gradient(135deg, #dc3545 0%, #e85d75 100%);
                    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
                }
                
                .stat-warning {
                    background: linear-gradient(135deg, #ffc107 0%, #ffda6a 100%);
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
                    color: #212529;
                }
                
                .stat-info {
                    background: linear-gradient(135deg, #17a2b8 0%, #3dd5f3 100%);
                    box-shadow: 0 4px 15px rgba(23, 162, 184, 0.2);
                }
                
                .print-date {
                    color: #6c757d;
                    font-size: 0.7rem;
                    font-weight: 500;
                }
                
                .success-message {
                    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                    border: 1px solid #b8dacd;
                    border-radius: 6px;
                    padding: 1rem;
                    text-align: center;
                }
                
                .btn-modern {
                    padding: 8px 20px;
                    border-radius: 15px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    margin: 0 6px;
                    font-size: 0.7rem;
                }
                
                .btn-primary-modern {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                }
                
                .btn-secondary-modern {
                    background: linear-gradient(135deg, #6c757d 0%, #545b62 100%);
                    color: white;
                }
                
                .section-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, #007bff 50%, transparent 100%);
                    margin: 0.8rem 0;
                    border-radius: 1px;
                }
                
                .row.mb-4 {
                    margin-bottom: 0.8rem !important;
                }
                
                .employee-info-row p {
                    margin-bottom: 0.3rem;
                    font-size: 0.8rem;
                }
                
                .salary-calc-row p {
                    margin-bottom: 0.3rem;
                    font-size: 0.8rem;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <!-- Header -->
                <div class="header-section">
                    <h1><i class="fas fa-file-alt me-2"></i>التقرير الشهري للموظف</h1>
                    <h3>${employee.name}</h3>
                    <p>شهر ${monthName} ${year}</p>
                </div>
                
                <div class="content-section">
                    <!-- Employee Information -->
                    <div class="info-card card">
                        <div class="card-header">
                            <i class="fas fa-user"></i>معلومات الموظف
                        </div>
                        <div class="card-body">
                            <div class="row employee-info-row">
                                <div class="col-md-6">
                                    <p><strong>الاسم:</strong> ${employee.name}</p>
                                    <p><strong>الوظيفة:</strong> ${employee.position}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>المرتب الأساسي:</strong> ${employee.salary.toLocaleString()} ج.م</p>
                                    <p><strong>تاريخ التقرير:</strong> <span class="print-date">${new Date().toLocaleDateString('ar-EG')}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Monthly Summary -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="stat-box">
                                <h4>${monthlyStats.presentDays}</h4>
                                <p>أيام الحضور</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box stat-danger">
                                <h4>${monthlyStats.absentDays}</h4>
                                <p>أيام الغياب</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box stat-warning">
                                <h4>${deductionsInfo.totalDeductions.toLocaleString()}</h4>
                                <p>إجمالي الخصم (ج.م)</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box stat-info">
                                <h4>${remainingSalary.toLocaleString()}</h4>
                                <p>صافي المرتب (ج.م)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section-divider"></div>
                    
                    <!-- Attendance Details (Absent Days Only) -->
                    <div class="info-card card">
                        <div class="card-header">
                            <i class="fas fa-calendar-times"></i>أيام الغياب فقط
                        </div>
                        <div class="card-body">
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th><i class="fas fa-calendar-day me-1"></i>التاريخ</th>
                                            <th><i class="fas fa-calendar-week me-1"></i>اليوم</th>
                                            <th><i class="fas fa-times-circle me-1"></i>حالة الغياب</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${attendanceDetails}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Advances Details -->
                    <div class="info-card card">
                        <div class="card-header">
                            <i class="fas fa-money-bill-wave"></i>تفاصيل السلف
                        </div>
                        <div class="card-body">
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th><i class="fas fa-calendar-alt me-1"></i>التاريخ</th>
                                            <th><i class="fas fa-coins me-1"></i>المبلغ</th>
                                            <th><i class="fas fa-sticky-note me-1"></i>ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${advanceDetails}
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-3">
                                <p><strong>إجمالي السلف الشهرية:</strong> ${advanceInfo.amount.toLocaleString()} ج.م</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Salary Calculations -->
                    <div class="info-card card">
                        <div class="card-header">
                            <i class="fas fa-calculator"></i>حسابات المرتب
                        </div>
                        <div class="card-body">
                            <div class="row salary-calc-row">
                                <div class="col-md-6">
                                    <p><strong>المرتب الأساسي:</strong> ${employee.salary.toLocaleString()} ج.م</p>
                                    <p><strong>خصم أيام الغياب:</strong> ${deductionsInfo.absentDaysDeduction.toLocaleString()} ج.م</p>
                                    <p><strong>خصم السلف:</strong> ${deductionsInfo.advancesDeduction.toLocaleString()} ج.م</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>إجمالي الخصومات:</strong> ${deductionsInfo.totalDeductions.toLocaleString()} ج.م</p>
                                    <p class="h6 text-success"><strong>صافي المرتب:</strong> ${remainingSalary.toLocaleString()} ج.م</p>
                                    <p><small>نسبة المتبقي: ${((remainingSalary / employee.salary) * 100).toFixed(1)}%</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-4 no-print">
                        <button class="btn btn-modern btn-primary-modern" onclick="window.print()">
                            <i class="fas fa-print me-2"></i>طباعة التقرير
                        </button>
                        <button class="btn btn-modern btn-secondary-modern" onclick="window.close()">
                            <i class="fas fa-times me-2"></i>إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
}

// Helper function to get Arabic month name
function getArabicMonthName(date) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[date.getMonth()];
}

// Helper function to get all days in a month
function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
    }
    
    return days;
}

// Initialize service worker for offline functionality (if available)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
    });
}
