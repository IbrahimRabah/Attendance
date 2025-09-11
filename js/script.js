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
    initializeDatePicker();
    loadEmployeesFromStorage();
    console.log('Employees loaded:', employees.length);
    displayCurrentDate();
    renderWeekPagination();
    renderTable();
    updateStatistics();
    
    // Initialize employee filter
    $('#employeeFilter').on('keyup', function() {
        filterEmployeesByName();
    });
    console.log('Application initialized');
});

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
        currentWeek = 0;
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

// Generate attendance key for specific month and day
function getAttendanceKey(date, dayIndex) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${dayIndex}`;
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

// Render week pagination
function renderWeekPagination() {
    const weekPagination = $('#weekPagination');
    weekPagination.empty();
    
    const weeks = getWeeksInMonth(currentMonth);
    
    if (weeks.length === 0) {
        weekPagination.append(`
            <span class="text-muted">لا توجد أسابيع</span>
        `);
        return;
    }
    
    weeks.forEach((week, index) => {
        const firstDay = week[0];
        const lastDay = week[week.length - 1];
        const weekLabel = `الأسبوع ${index + 1}`;
        
        const isActive = index === currentWeek ? 'active' : '';
        const button = $(`
            <button type="button" class="btn btn-outline-primary btn-sm ${isActive}" 
                    onclick="selectWeek(${index})" title="${firstDay.getDate()}/${firstDay.getMonth() + 1} - ${lastDay.getDate()}/${lastDay.getMonth() + 1}">
                ${weekLabel}
            </button>
        `);
        
        weekPagination.append(button);
    });
}

// Select specific week
function selectWeek(weekIndex) {
    currentWeek = weekIndex;
    renderWeekPagination();
    renderTable();
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
    const advanceDate = employee.advanceDate ? new Date(employee.advanceDate) : new Date();
    const dateStr = advanceDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return {
        amount: employee.advance || 0,
        date: dateStr
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
    
    const newEmployee = {
        id: Date.now(),
        name: name,
        position: position,
        salary: salary,
        advance: advance,
        advanceDate: advanceDate || new Date().toISOString().split('T')[0],
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
    
    $('#editEmployeeId').val(employee.id);
    $('#editEmployeeName').val(employee.name);
    $('#editEmployeePosition').val(employee.position);
    $('#editEmployeeSalary').val(employee.salary);
    $('#editEmployeeAdvance').val(employee.advance);
    $('#editEmployeeAdvanceDate').val(employee.advanceDate || new Date().toISOString().split('T')[0]);
    
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
        employee.advance = advance;
        employee.advanceDate = advanceDate || employee.advanceDate || new Date().toISOString().split('T')[0];
        
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
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع بيانات الحضور الخاصة به.')) {
        return;
    }
    
    employees = employees.filter(emp => emp.id !== employeeId);
    filteredEmployees = filteredEmployees.filter(emp => emp.id !== employeeId);
    
    saveEmployeesToStorage();
    renderWeekPagination();
    renderTable();
    updateStatistics();
    
    showNotification('تم حذف الموظف بنجاح', 'success');
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
    currentWeek = 0;
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
        
        totalAdvances += employee.advance || 0;
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
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.removeItem('attendanceEmployees');
        employees = [];
        filteredEmployees = [];
        renderWeekPagination();
        renderTable();
        updateStatistics();
        showNotification('تم حذف جميع البيانات', 'success');
    }
}

// Auto-save reminder
setInterval(() => {
    saveEmployeesToStorage();
}, 30000); // Save every 30 seconds

// Initialize service worker for offline functionality (if available)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
    });
}
