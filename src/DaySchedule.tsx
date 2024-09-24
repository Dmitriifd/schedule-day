import { useState, useEffect, useRef } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';

import { openDB } from 'idb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast, Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, PencilIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScheduleSkeleton } from './components/ScheduleSkeleton';
import { ScheduleItem } from './types';
import { ImperativePanelHandle } from 'react-resizable-panels';

type PanelType = HTMLDivElement & ImperativePanelHandle;

export function DaySchedule() {
  const panelRef = useRef<PanelType | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [startTime, setStartTime] = useState(10);
  const [endTime, setEndTime] = useState(18);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [scheduleName, setScheduleName] = useState('');
  const [allSchedules, setAllSchedules] = useState<string[]>([]);
  const [isEditingName, setIsEditingName] = useState(true);
  const [oldScheduleName, setOldScheduleName] = useState('');
  const [selectedScheduleName, setSelectedScheduleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dbPromise = openDB('scheduleDB', 1, {
    upgrade(db) {
      db.createObjectStore('schedules', { keyPath: 'name' });
    },
  });

  const formatTime = (hour: number) => {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${((hour + 1) % 24).toString().padStart(2, '0')}:00`;
    return `${start} - ${end}`;
  };

  const generateSchedule = () => {
    const newSchedule = [];
    let currentHour = startTime;
    while (currentHour !== endTime) {
      newSchedule.push({
        id: `time-${currentHour}`,
        time: formatTime(currentHour),
        description: '',
      });
      currentHour = (currentHour + 1) % 24;
    }
    setSchedule(newSchedule);
    setScheduleName('');
    setIsEditingName(true);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index].description = value;
    setSchedule(newSchedule);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(schedule);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => {
      const hour = (startTime + index) % 24;
      return {
        ...item,
        time: formatTime(hour),
      };
    });

    setSchedule(updatedItems);
  };

  const saveSchedule = async () => {
    if (!scheduleName) {
      toast.error('Введите название расписания!');
      return;
    }

    const db = await dbPromise;

    if (oldScheduleName && oldScheduleName !== scheduleName) {
      await db.delete('schedules', oldScheduleName);
    }

    await db.put('schedules', { name: scheduleName, schedule });

    toast.success(`Расписание "${scheduleName}" сохранено!`);

    setOldScheduleName('');
    setScheduleName('');
    setSchedule([]);
    setIsEditingName(false);
    setSelectedScheduleName(null);
    loadAllSchedules();
  };

  const loadSchedule = async (name: string) => {
    setSelectedScheduleName(name);
    const db = await dbPromise;
    const data = await db.get('schedules', name);
    if (data) {
      setSchedule(data.schedule);
      setScheduleName(name);
      setIsEditingName(false);
      toast.success(`Расписание "${name}" загружено!`);
    }
  };

  const loadAllSchedules = async () => {
    const db = await dbPromise;
    const allKeys = await db.getAllKeys('schedules');
    setAllSchedules(allKeys as string[]);
  };

  const deleteSchedule = async (name: string) => {
    const db = await dbPromise;
    await db.delete('schedules', name);
    toast.success(`Расписание "${name}" удалено!`);
    loadAllSchedules();
  };

  const editScheduleName = (name: string) => {
    setOldScheduleName(scheduleName);
    setScheduleName(name);
    setIsEditingName(true);
  };

  useEffect(() => {
    loadAllSchedules();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    if (panelRef.current) {
      const startSize = collapsed ? 0 : 25;
      const endSize = collapsed ? 25 : 0;
      const duration = 300;
      let startTime: null | number = null;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;
        const currentSize = startSize + (endSize - startSize) * Math.min(progress, 1);

        panelRef.current?.resize(currentSize);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCollapsed(!collapsed);
        }
      };

      requestAnimationFrame(animate);
    }
  };

  return (
    <div className='relative container mx-auto '>
      <ResizablePanelGroup
        direction='horizontal'
        className='min-h-[200px] max-w-full rounded-lg border md:min-w-[450px]'
      >
        <ResizablePanel ref={panelRef} defaultSize={25} maxSize={40}>
          <div className='flex h-full flex-col p-6 min-h-screen'>
            <h2 className='text-xl font-bold mb-4 mt-4'>Расписания</h2>
            {isLoading ? (
              <ScheduleSkeleton />
            ) : (
              <ul className='mt-4'>
                {allSchedules.map((name) => (
                  <li key={name} className='flex justify-between items-center mb-2 gap-2'>
                    <button onClick={() => loadSchedule(name)}>{name}</button>
                    <div className='flex items-center'>
                      {selectedScheduleName === name && (
                        <Button onClick={() => editScheduleName(name)} className='mr-2'>
                          <PencilIcon className='h-4 w-4' />
                        </Button>
                      )}
                      <Button onClick={() => deleteSchedule(name)}>Удалить</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          {/* Основной блок с расписанием */}
          <div className='flex h-full justify-center p-6 '>
            <div className='w-full '>
              <Toaster position='top-right' />
              <h1 className='text-2xl font-bold mb-4'>Гибкое расписание</h1>
              <div className='flex gap-4 items-center pb-6 border-0 border-b-[1px]'>
                <div>
                  {/* <label htmlFor='startTime'>Время начала</label> */}
                  <Input
                    id='startTime'
                    type='number'
                    min='0'
                    max='23'
                    value={startTime}
                    onChange={(e) => setStartTime(parseInt(e.target.value))}
                    className='w-20'
                  />
                </div>
                <div>
                  {/* <label htmlFor='endTime'>Время окончания</label> */}
                  <Input
                    id='endTime'
                    type='number'
                    min='0'
                    max='23'
                    value={endTime}
                    onChange={(e) => setEndTime(parseInt(e.target.value))}
                    className='w-20'
                  />
                </div>
                <Button onClick={generateSchedule}>Создать расписание</Button>
              </div>

              {/* Поле для ввода/редактирования названия расписания */}
              {schedule.length > 0 && isEditingName && (
                <div className='mb-4'>
                  <Label htmlFor='scheduleName'>Название расписания</Label>
                  <Input
                    id='scheduleName'
                    type='text'
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder='Введите название расписания'
                    className='w-full mt-2'
                  />
                </div>
              )}

              {schedule.length > 0 && (
                <>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Table className='w-full'>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[50px]'></TableHead>
                          <TableHead className='w-1/4'>Время</TableHead>
                          <TableHead className='pl-5'>Описание</TableHead>
                        </TableRow>
                      </TableHeader>
                      <Droppable droppableId='schedule'>
                        {(provided) => (
                          <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                            {schedule.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <TableRow
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`${
                                      snapshot.isDragging ? 'bg-muted' : ''
                                    } transition-colors`}
                                  >
                                    <TableCell className='w-[50px]'>
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className='h-5 w-5 text-gray-500' />
                                      </div>
                                    </TableCell>
                                    <TableCell className='w-1/4 font-medium'>{item.time}</TableCell>
                                    <TableCell className='w-3/4'>
                                      <Input
                                        type='text'
                                        value={item.description}
                                        onChange={(e) =>
                                          handleDescriptionChange(index, e.target.value)
                                        }
                                        placeholder='Добавьте описание...'
                                        className='w-full border-0 shadow-none'
                                      />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </TableBody>
                        )}
                      </Droppable>
                    </Table>
                  </DragDropContext>

                  <Button onClick={saveSchedule} className='mt-4'>
                    Сохранить расписание
                  </Button>
                </>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Кнопка для сворачивания/разворачивания */}
      <button
        onClick={toggleSidebar}
        className='absolute top-1 left-1 bg-slate-200 p-1 rounded-full'
      >
        {collapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </div>
  );
}
