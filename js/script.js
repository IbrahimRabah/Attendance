// Attendance Management System JavaScript

// Global variables
let employees = [];
let currentMonth = new Date();
let filteredEmployees = [];
let currentWeek = 0;

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
    loadEmployeesFromStorage();
    console.log('Employees loaded:', employees.length);
    displayCurrentDate();
    setCurrentWeekBasedOnToday();
    renderWeekPagination();
    renderTable();
    updateStatistics();
    
    // Initialize employee filter
    $('#employeeFilter').on('keyup', function() {
        filterEmployeesByName();
    });
    
    // Set default date for advance modal
    $('#advanceDate').val(new Date().toISOString().split('T')[0]);
    
    console.log('Application initialized');
});

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            showDeleteConfirmation(
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
    } else {
        // Initialize with sample data
        employees = [
            {
                id: 1,
                name: 'أحمد محمد علي',
                position: 'مطور ويب',
                salary: 5000,
                advance: 500,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 2,
                name: 'فاطمة أحمد حسن',
                position: 'مصممة جرافيك',
                salary: 4500,
                advance: 300,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 3,
                name: 'محمد عبد الله إبراهيم',
                position: 'مدير مشروع',
                salary: 6000,
                advance: 800,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 4,
                name: 'نور الدين خالد',
                position: 'محاسب',
                salary: 4000,
                advance: 200,
                advanceDate: '2025-09-01',
                attendance: {}
            },
            {
                id: 5,
                name: 'مريم سعد الدين',
                position: 'مطورة تطبيقات',
                salary: 5500,
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
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const weeks = [];
    let currentWeek = [];
    
    // Go through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
        
        // Convert to our week structure (Saturday=0, Sunday=1, ..., Thursday=5)
        const ourDayIndex = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
        
        // Start new week on Saturday (ourDayIndex = 0)
        if (ourDayIndex === 0 && currentWeek.length > 0) {
            weeks.push([...currentWeek]);
            currentWeek = [];
        }
        
        currentWeek.push(currentDate);
        
        // If it's the last day of the month, push the current week
        if (day === daysInMonth && currentWeek.length > 0) {
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
                <td colspan="13" class="text-center text-muted py-4">
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
        
        // Employee basic info
        row.append(`
            <td class="align-middle">
                <strong>${employee.name}</strong>
            </td>
            <td class="align-middle">${employee.position}</td>
            <td class="align-middle salary-cell">
                ${employee.salary.toLocaleString()} ج.م
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
                <td colspan="13" class="p-0">
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
    const advance = parseFloat($('#employeeAdvance').val()) || 0;
    const advanceDate = $('#employeeAdvanceDate').val();
    
    if (!name || !position || salary <= 0) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'danger');
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
    const advance = parseFloat($('#editEmployeeAdvance').val()) || 0;
    const advanceDate = $('#editEmployeeAdvanceDate').val();
    
    if (!name || !position || salary <= 0) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee.name = name;
        employee.position = position;
        employee.salary = salary;
        
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
    
    if (searchTerm === '') {
        filteredEmployees = [...employees];
    } else {
        filteredEmployees = employees.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.position.toLowerCase().includes(searchTerm)
        );
    }
    
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
    $('#monthPicker').datepicker('setDate', new Date());
    currentMonth = new Date();
    setCurrentWeekBasedOnToday();
    filteredEmployees = [...employees];
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
    });
    
    $('#presentToday').text(presentToday);
    $('#absentToday').text(absentToday);
    $('#totalAdvances').text(totalAdvances.toLocaleString() + ' ج.م');
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

// Initialize service worker for offline functionality (if available)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
    });
}
