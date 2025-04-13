import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Todo } from '../core/models/todo.model';
import { TodoComponent } from './todo.component';
import { BaseTodoComponent } from './base-todo.component';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TodoComponent]
})
export class TodoListComponent extends BaseTodoComponent {
  @Input() todos: Todo[] = [];
  @Input() title: string = '';
  
  @Output() override statusChange = new EventEmitter<number>();
  @Output() override deleteRequest = new EventEmitter<number>();
  @Output() override editRequest = new EventEmitter<Todo>();
  @Output() override addImageRequest = new EventEmitter<Todo>();
  @Output() override firebaseDeleteRequest = new EventEmitter<number>();

  constructor() {
    super();
  }

  onStatusChange(todoId: number): void {
    this.emitStatusChange(todoId);
  }

  onDeleteRequest(todoId: number): void {
    this.emitDeleteRequest(todoId);
  }

  onFirebaseDeleteRequest(todoId: number): void {
    this.emitFirebaseDeleteRequest(todoId);
  }

  onEditRequest(todo: Todo): void {
    this.emitEditRequest(todo);
  }

  onAddImageRequest(todo: Todo): void {
    this.emitAddImageRequest(todo);
  }
} 