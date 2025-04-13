import { EventEmitter } from '@angular/core';
import { Todo } from '../core/models/todo.model';

export abstract class BaseTodoComponent {
  statusChange = new EventEmitter<number>();
  deleteRequest = new EventEmitter<number>();
  editRequest = new EventEmitter<Todo>();
  addImageRequest = new EventEmitter<Todo>();
  firebaseDeleteRequest = new EventEmitter<number>();

  constructor() {}

  protected emitStatusChange(todoId: number): void {
    this.statusChange.emit(todoId);
  }

  protected emitDeleteRequest(todoId: number): void {
    this.deleteRequest.emit(todoId);
  }

  protected emitFirebaseDeleteRequest(todoId: number): void {
    this.firebaseDeleteRequest.emit(todoId);
  }

  protected emitEditRequest(todo: Todo): void {
    this.editRequest.emit(todo);
  }

  protected emitAddImageRequest(todo: Todo): void {
    this.addImageRequest.emit(todo);
  }
} 