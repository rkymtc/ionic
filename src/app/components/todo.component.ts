import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Todo } from '../core/models/todo.model';
import { BaseTodoComponent } from './base-todo.component';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TodoComponent extends BaseTodoComponent {
  @Input() todo!: Todo;
  
  @Output() override statusChange = new EventEmitter<number>();
  @Output() override deleteRequest = new EventEmitter<number>();
  @Output() override editRequest = new EventEmitter<Todo>();
  @Output() override addImageRequest = new EventEmitter<Todo>();
  @Output() override firebaseDeleteRequest = new EventEmitter<number>();

  constructor() {
    super();
  }

  toggleStatus(): void {
    // console.log(' todo:', this.todo);
  
    
    if (!this.todo.completed) {
      this.todo.completedAt = new Date();
    } else {
      this.todo.completedAt = undefined;
    }
    
    this.emitStatusChange(this.todo.id);
  }

  deleteTodo(): void {
    this.emitDeleteRequest(this.todo.id);
  }
  
  deleteFromFirebase(): void {
    this.emitFirebaseDeleteRequest(this.todo.id);
  }

  editTodo(): void {
    this.emitEditRequest(this.todo);
  }

  addImage(): void {
    this.emitAddImageRequest(this.todo);
  }
} 