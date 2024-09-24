import { Skeleton } from "./ui/skeleton";

export function ScheduleSkeleton() {
  return (
    <ul className='mt-4'>
      {[...Array(5)].map((_, index) => (
        <li key={index} className='flex justify-between items-center mb-2 gap-2'>
          <Skeleton className='h-6 w-[200px]' />
          <div className='flex items-center'>
            <Skeleton className='h-6 w-8 mr-2' />
            <Skeleton className='h-6 w-[80px]' />
          </div>
        </li>
      ))}
    </ul>
  )
}