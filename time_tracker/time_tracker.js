// IntervalID: идентификатор текущего интервала таймера.
var IntervalID = 0,
    ID = 0;

function NextTaskID( )
{
    return ( ID++ );
}
//Извлекаем строку Tuskarr JSON из хранилища DOM, преобразуем ее в объект JavaScript и верните его.  Если в хранилище DOM нет Tuskarr,вернет пустой объект JavaScript.
function RetrieveTaskArr( )
{
    var TaskArr_JSON = '',
        TaskArr = {};

    if ( localStorage.getItem('TaskArr') )
    {
        TaskArr_JSON = localStorage.getItem('TaskArr');
        TaskArr      = JSON.parse(TaskArr_JSON);
    }

    return ( TaskArr );

} 
//Преобразовываем Tuskarr в JSON и сохраните его в локальном хранилище DOM.
function SaveTaskArr( TaskArr )
{
    var TaskArr_JSON = JSON.stringify(TaskArr);

    localStorage.setItem('TaskArr', TaskArr_JSON);

} 
//Линейный поиск по массиву задач. Возвращает значение true, если имя какой-либо задачи соответствует заданному имени задачи. В противном случае верните значение false.
function TaskAlreadyExistsinArr( TaskArr, TaskName )
{
    for ( var Task in TaskArr )
    {
        if ( TaskArr[Task].Name == TaskName )
        {
            return ( true );
        }
    }

    return ( false );

} 
// С помощью CSS делаем task chiclet активным.
function ActivateTask( TaskID )
{
    var TaskObj  = $( '#' + TaskID ),
        CloseObj = TaskObj.parent().find( '#' + TaskID + '_remove' );

    if ( TaskObj.hasClass('task_mouseover') )
    {
        TaskObj.removeClass( 'task_mouseover' )
               .addClass( 'task_current_mouseover' );
    }
    else if ( TaskObj.hasClass( 'task_inactive' ) )
    {
        TaskObj.removeClass( 'task_inactive' )
               .addClass( 'task_current' );
    }

    CloseObj.removeClass( 'close_task_div_inactive' )
            .addClass( 'close_task_div_active' );


}
//С помощью CSS делаем так, чтобы task chiclet выглядел неактивным.
function DeactivateTask( TaskID )
{
    var TaskArr        = RetrieveTaskArr(),
        Task           = TaskArr[TaskID],
        TaskObj        = $( '#' + TaskID ),
        Timestamp      = parseInt( Task.Timestamp ),
        TotElapsedTime = parseInt( Task.TotElapsedTime ),
        CloseObj       = TaskObj.parent().find( '#' + TaskID + '_remove' );

    if ( TaskObj.hasClass('task_current_mouseover') )
    {
        TaskObj.removeClass( 'task_current_mouseover' ).
                addClass( 'task_mouseover' );
    }
    else if ( TaskObj.hasClass('task_current') )
    {
        TaskObj.removeClass( 'task_current' )
               .addClass( 'task_inactive' );
    }

    CloseObj.removeClass( 'close_task_div_active' )
            .addClass( 'close_task_div_inactive' );
    //Обновляем общее затраченное время.      
    Task.TotElapsedTime = ( TotElapsedTime + (Date.now()-Timestamp) ).toString();
    Task.ElapsedSince = "0";
    Task.TaskActive = false;
    TaskArr[TaskID] = Task;
    SaveTaskArr( TaskArr );

} 
//Преобразовываем некоторое количество миллисекунд в часы, минуты и секунды и возвращаем преобразованное значение.
function ConvertMillisecondsToHoursMinsSecs( Milliseconds )
{
    var NumMillisecondsInHour   = 3600000,
        NumMillisecondsInMinute = 60000,
        NumMillisecondsInSecond = 1000,
        Hours   = 0,
        Minutes = 0,
        Seconds = 0;

    if ( Milliseconds >= NumMillisecondsInHour )
    {
        Hours = Math.floor( Milliseconds / NumMillisecondsInHour );
        Milliseconds %= NumMillisecondsInHour;
    }
    
    if ( Milliseconds >= NumMillisecondsInMinute )
    {
        Minutes = Math.floor( Milliseconds / NumMillisecondsInMinute );
        Milliseconds %= NumMillisecondsInMinute;
    }

    if ( Milliseconds >= NumMillisecondsInSecond )
    {
        Seconds = Math.round( Milliseconds / NumMillisecondsInSecond );
    }

    return( { 'Hours'  : Hours,
              'Minutes': Minutes,
              'Seconds': Seconds } );

} 
//Остановить текущую активную задачу и, если пользователь нажал на неактивную задачу,запустить таймер этой задачи.
function StartTimer( event )
{
    var TaskID = $(this).attr('id'),
        $this  = $(this),
        Timer;

    if (IntervalID != 0)
    {
        //Остановите текущий таймер
        clearInterval( IntervalID );
        IntervalID = 0;
    }
    if ( $this.attr('id') == localStorage.CurrentTaskID )
    {
        //Пользователь нажал на текущую задачу.  Очистите текущую задачу и готово.
        DeactivateTask( localStorage.CurrentTaskID );
        localStorage.setItem( 'CurrentTaskID', -1 );
    }
    else
    {
        TaskArr = RetrieveTaskArr();
        Task = TaskArr[TaskID];
        Task.Timestamp = Date.now().toString();
        Task.TaskActive = true;
        TaskArr[TaskID] = Task;
        SaveTaskArr( TaskArr );

        //Пользователь нажал на задачу, отличную от текущей задачи.  Запустите таймер и запишите, какая задача является текущей.
        IntervalID = setInterval(function() {
            var HoursMinsSecs  = {},
                Interval       = 0,
                TaskArr        = RetrieveTaskArr( );
                Task           = TaskArr[TaskID],
                TotElapsedTime = parseInt(Task.TotElapsedTime),
                TaskTimestamp  = parseInt(Task.Timestamp),
                Timer          = $this.find( '#' + TaskID + '_timer' );

            //Сколько времени прошло с тех пор, как был запущен таймер?
            Interval = Date.now() - TaskTimestamp;
            // Преобразуйте общее время выполнения в мс в часы/минуты/секунды.
            HoursMinsSecs = ConvertMillisecondsToHoursMinsSecs( Interval + TotElapsedTime );
            //Обновите таймер в DOM.
            Timer.text(HoursMinsSecs.Hours + ':' + HoursMinsSecs.Minutes + ':' + HoursMinsSecs.Seconds);
            //Сохраните в локальном хранилище DOM, сколько времени прошло с момента последнего запуска таймера, чтобы, если окно закрыто во время таймер все еще работает, мы можем правильно восстановить задачу при перезагрузке страницы.
            Task.ElapsedSince = Interval.toString();
            TaskArr[TaskID] = Task;
            SaveTaskArr( TaskArr );
        }, 1000);
        //Деактивируйте ранее текущую задачу, если таковая существовала, запишите имя новой текущей задачи и активируйте новую текущую задачу.
        if ( localStorage.getItem('CurrentTaskID') )
        {
            if ( parseInt(localStorage.CurrentTaskID) !== -1 )
            {
                DeactivateTask( localStorage.CurrentTaskID );
            }
        }
        localStorage.setItem( 'CurrentTaskID', TaskID );
        ActivateTask( localStorage.CurrentTaskID );

    } 
//Удалите задачу из DOM и из локального хранилища DOM.
} 
function RemoveTask( event )
{
    var $this     = $(this),
        DivID     = $this.attr('id'),
        TaskArr   = RetrieveTaskArr(),
        TaskDelim = DivID.indexOf('_'),
        TaskID    = DivID.substring(0, TaskDelim);
    delete TaskArr[TaskID];
    SaveTaskArr( TaskArr );

    if ( localStorage.CurrentTaskID == TaskID )
    {
        //Если задача, которую мы удаляем, имеет текущий идентификатор задачи(clearInterval),остановите таймер и очистите соответствующий IntervalID.
        clearInterval( IntervalID );
        IntervalID = 0;
        localStorage.setItem( 'CurrentTaskID', -1 );
    }
    //Удаляя родительский DIV, мы удаляем всю задачу из DOM.
    $this.parent().remove();

} 
//С помощью CSS выделите task chiclet, который в данный момент находится под курсором.
function MouseEnterTask( event )
{
    var $this       = $(this),
        DivID       = $this.attr('id'),
        TaskArr,
        TaskDelim   = DivID.indexOf('_'),
        TaskID      = DivID.substring(0, TaskDelim),
        MainTaskDiv = $this.find( '.task_div' );

    if ( MainTaskDiv.hasClass('task_inactive') )
    {
        MainTaskDiv.removeClass( 'task_inactive' )
                   .addClass( 'task_mouseover' );

    }
    else if ( MainTaskDiv.hasClass('task_current') )
    {
        MainTaskDiv.removeClass( 'task_current' )
                   .addClass( 'task_current_mouseover' );
    }

    $this.find( '#' + TaskID + '_remove' ).show();

} 
//Установите для CSS-файла task chiclet значение не выделенный.
function MouseLeaveTask( event )
{
    var $this       = $(this),
        DivID       = $this.attr('id'),
        TaskArr,
        TaskDelim   = DivID.indexOf('_'),
        TaskID      = DivID.substring(0, TaskDelim),
        MainTaskDiv = $this.find( '.task_div' );

    if ( MainTaskDiv.hasClass('task_mouseover') )
    {
        MainTaskDiv.removeClass( 'task_mouseover' )
                   .addClass( 'task_inactive' );
    }
    else if ( MainTaskDiv.hasClass('task_current_mouseover') )
    {
        MainTaskDiv.removeClass( 'task_current_mouseover' )
                   .addClass( 'task_current' );
    }

    $this.find( '#' + TaskID + '_remove' ).hide();

} 
//Добавьте задачу в Tuskarr в локальном хранилище DOM и в DOM.
function AddTask( TaskID, Task )
{
    var CloseButtonDiv,
		DropDiv,
        HoursMinsSecs = {},
        MainTaskDiv,
        Now,
        TaskDiv,
        TaskArr_JSON,
        TaskArr = RetrieveTaskArr(),
        Time = 0,
        TimeSinceLastActivation = 0;
    //Если мы еще не сталкивались с этой задачей, сохраните ее в локальном ВНУТРЕННЕМ хранение.Примечание: задача может находиться в локальном хранилище DOM с предыдущей страницы экземпляр, даже если его нет в DOM.
    if ( !(TaskID in TaskArr) )
    {
        TaskArr[TaskID] = Task;
        SaveTaskArr( TaskArr );
    }
    // Восстановить таймер, который был запущен, когда страница была закрыта в последний раз.
    if ( parseInt(Task.ElapsedSince) > 0 )
    {
        if ( ! Task.TaskActive )
        {
            Time = parseInt( Task.TotElapsedTime ) + parseInt( Task.ElapsedSince );
            Task.TotElapsedTime = Time.toString();
        }
        else
        {
            // Состояние активной задачи немного отличается от состояния любой из неактивных задач. Временная метка задачи остается установленной на время в на котором была нажата/активирована задача. Общее затраченное время показывает сколько времени прошло до последней активации.Итак, для задач, которые были активны, определите, сколько времени прошло между настоящим моментом и активацией задачи и добавлением прошедшего времени.Это время следует использовать при перестройке task chiclet и добавлении это к DOM.
            Now = new Date();
            TimeSinceLastActivation = Now - parseInt( Task.Timestamp );
            Task.TotElapsedTime = parseInt( Task.TotElapsedTime ) +
                                  TimeSinceLastActivation;
        }
        Task.ElapsedSince   = "0";
        Task.Timestamp      = "0";
        TaskArr[TaskID]     = Task;
        SaveTaskArr( TaskArr );
    }
    //Создайте task chiclet.
    HoursMinsSecs = ConvertMillisecondsToHoursMinsSecs( parseInt(Task.TotElapsedTime) );
    MainTaskDiv = $( '<div id="' + TaskID + '_main"' +
                     'class="main_task_div"'  +
                     'data-taskid="' + TaskID + '"'  +
                     'draggable="true"></div>' );
    CloseButtonDiv = $( '<div id="' + TaskID + '_remove"' +
                     'class="close_task_div_inactive">&times;</div>' );
    TaskDiv = $( '<div id="' + TaskID + '" class="task_div task_inactive">' +
                     '<div>'              +
                          Task.Name       +
                     '</div>'             +
                     '<div id="' + TaskID + '_timer">' +
                          HoursMinsSecs.Hours    + ':' +
                          HoursMinsSecs.Minutes  + ':' +
                          HoursMinsSecs.Seconds  +
                     '</div>'             +
                 '</div>' );
	DropDiv = $( '<div id="' + TaskID + '_drop" class="drop_target"></div>' );
    MainTaskDiv.append( CloseButtonDiv );
    MainTaskDiv.append( TaskDiv );
	MainTaskDiv.append( DropDiv );
     // Добавить обработчики кликов.
    CloseButtonDiv.hide();
    CloseButtonDiv.click( RemoveTask );
    TaskDiv.click( StartTimer );
    // Добавить комбинированный MouseEnter и обработчик MouseLeave
    MainTaskDiv.hover( MouseEnterTask, MouseLeaveTask )
               .on( 'dragstart', function(event) {
  
        // При запуске перетаскивания сохраните идентификатор задачи. Это будет использоваться для идентификации какую задачу chiclet переместить при выпадении.
        event.originalEvent.dataTransfer.setData( 'application/x-taskid',
                                                  $(this).data('taskid') );
    });
    // У каждого чиклета задачи есть цель выпадения внизу. Добавьте обработчики перетаскивания включить перетаскивание.
    DropDiv.on( 'dragover dragenter', activateDropTarget )
           .on( 'dragleave', deactivateDropTarget )
           .on( 'drop', dropOnTarget );
    // Добавить в DOM.
    $( '#TaskList' ).append( MainTaskDiv );
} 
//Обработчик события 'drop' для каждой цели удаления. У каждой задачи chiclet есть выпадение цель внизу. Кроме того, в самом верху списка задач есть выпадающая цель, которая не привязана к task chiclet.
function dropOnTarget( event )
{
    var TaskID = event.originalEvent.dataTransfer.getData('application/x-taskid'),
        $theTask = $( '#' + TaskID + '_main' ),
        $this = $(this);
    //Уменьшите цель сброса обратно до нормального размера.
    $this.prop( "class", "drop_target" );
    // Если task chiclet был удален на своей собственной цели удаления, то мы закончили здесь.
    if ( $theTask.data('taskid') === $this.parent().data('taskid') )
    {
        return( false );
    }
    //Удалите перетаскиваемую задачу из DOM и повторно прикрепите ее в папке dropped.
    $theTask.detach();

    if ( $this.prop('id') === 'top_drop' ) {
        $this.after( $theTask );
    } else {
        $this.parent().after( $theTask );
    }

    return( false );
}
//Когда задача перетаскивается поверх цели перетаскивания, увеличьте цель — с помощью CSS — до указывает, что задача может быть удалена.
function activateDropTarget( event )
{
	event.preventDefault();
	event.stopPropagation();

    $(this).prop( "class", "active_drop_target" );

	return false;
}
//Сжимайте цель перетаскивания при возникновении события "перетаскивания".
function deactivateDropTarget( event )
{
	event.preventDefault();
	event.stopPropagation();

    $(this).prop( "class", "drop_target" );

	return false;
}
//Отправить обработчик для формы отправки задачи в верхней части страницы.
function SubmitTask( event )
{
    var FormTextField = $( '#Form_TaskName' ),
        StartTimerField = $( '#StartTimer' ),
        StartTimer = StartTimerField.val(),
        TaskArr,
        TaskName   = FormTextField.val(),
        TaskID     = -1;


    event.preventDefault();
    event.stopPropagation();
    //Очистите поля формы.
    FormTextField.val( '' );
    StartTimerField.val( 0 );

    if ( TaskName.length > 0 )
    {
        //Извлеките Tuskarr из локального хранилища DOM и проверьте, является ли это задача уже существует.
        TaskArr = RetrieveTaskArr();

        TaskExists = TaskAlreadyExistsinArr( TaskArr, TaskName );
        if ( ! TaskExists )
        {
            //Добавьте задачу в локальное хранилище DOM и в DOM.
            TaskID = NextTaskID();
            AddTask( TaskID,
                      { 'Name'          : TaskName,
                        'Timestamp'     : 0,
                        'TotElapsedTime': 0,
                        'ElapsedSince'  : 0,
                        'TaskActive'    : false } );

            if ( StartTimer == 1 )
            {
                //Пользователь хочет, чтобы таймер запускался после добавления задачи в DOM.  Чтобы запустить таймер, имитируйте событие щелчка на панели задач.
                $( '#' + TaskID ).trigger( 'click' );
            }
        }
        else
        {
            //Сообщите пользователю, что эта задача уже существует.
            alert( 'Эта задача уже существует!' );
        }
    } 
    return ( TaskID );

} 
//Запустите, как только DOM будет полностью собран.  Это в основном main().
$(document).ready(function() {
    var TaskArr,
        TaskID,
        TaskID_int;

    localStorage.setItem( 'CurrentTaskID', -1 );

    $( '#TrackTimeButton' ).on( 'click', function(event) {
        // Установите значение скрытой формы равным true, чтобы сообщить обработчику задачи отправки, что таймер также должен быть запущен.
        $( '#StartTimer' ).val( 1 );
    });
    // Обработчик отправки для формы задачи.
    $( '#TaskForm' ).submit( SubmitTask );
    // Похоже, что предыдущий экземпляр этой программы запустил некоторые задачи в DOM хранение.  Извлеките и отобразите их.
    TaskArr = RetrieveTaskArr();
    for ( TaskID in TaskArr )
    {
        // TaskId берется из массива, который был сохранен в формате JSON.  Каждый scalar был восстановлен из JSON обратно в строку JavaScript.Итак, преобразуем идентификатор в int.
        TaskID_int = parseInt( TaskID );

        AddTask( TaskID, TaskArr[TaskID] );
        if ( TaskID_int >= ID )
        {
            // Установите глобальный идентификатор на единицу больше, чем самый большой идентификатор задачи, который мы нашли в локальном хранилище DOM.
            ID = TaskID_int + 1;
        }
        // Если задача была активна, повторно активируйте ее с помощью имитируемого щелчка
        if ( TaskArr[TaskID].TaskActive == true )
        {
            $( '#' + TaskID ).trigger( 'click' );
        }
    }
    //Активируйте выпадающую цель в верхней части списка задач.
    $( '#top_drop' ).on( 'dragover dragenter', activateDropTarget )
                    .on( 'dragleave', deactivateDropTarget )
                    .on( 'drop', dropOnTarget ); 
    
    
}); 

