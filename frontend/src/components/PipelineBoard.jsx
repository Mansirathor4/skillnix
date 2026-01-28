import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const PipelineBoard = ({ candidates, onDragEnd }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 bg-slate-100 min-h-[500px]">
        {stages.map((stage) => (
          <Droppable key={stage} droppableId={stage}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="bg-slate-200 p-3 rounded-xl w-72 min-h-max">
                <h3 className="font-bold mb-4 text-slate-700 uppercase text-sm px-2">{stage}</h3>
                
                {candidates.filter(c => c.status === stage).map((candidate, index) => (
                  <Draggable key={candidate._id} draggableId={candidate._id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                        className="bg-white p-4 mb-3 rounded-lg shadow-sm border border-slate-300 hover:border-indigo-500 transition-all">
                        <p className="font-bold text-slate-800">{candidate.name}</p>
                        <p className="text-xs text-slate-500">{candidate.position}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default PipelineBoard;