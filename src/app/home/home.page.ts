import { Component, OnInit, OnDestroy } from '@angular/core';
import { Todo } from '../core/models/todo.model';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../core/services/firebase.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  taskTitle = '';
  taskDescription = '';
  taskDueDate = new Date().toISOString();
  taskImageUrl?: string;
  incompleteTasks: Todo[] = [];
  completedTasks: Todo[] = [];
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private firebaseService: FirebaseService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
  }
  
  ngOnDestroy() {
    this.clearSubscriptions();
  }

  private clearSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  private loadData() {
    this.clearSubscriptions();
        
    this.subscriptions.push(
      this.firebaseService.getIncompleteTodos().subscribe(todos => {
        this.incompleteTasks = todos;
      })
    );
      
    this.subscriptions.push(
      this.firebaseService.getCompletedTodos().subscribe(todos => {
        this.completedTasks = todos;
      })
    );
  }
  
  private async handleOperation(
    operation: () => Promise<void>,
    successMessage: string,
    errorPrefix: string
  ): Promise<void> {
    try {
      await operation();
      await this.presentToast(successMessage);
    } catch (error) {
      console.error(`${errorPrefix}:`, error);
      await this.presentToast(`${errorPrefix} bir hata oluştu`, 'danger');
    }
  }

  async addTask() {
    if (this.taskTitle.trim() !== '') {
      await this.handleOperation(async () => {
        const dueDate = new Date(this.taskDueDate);
        await this.firebaseService.addTodo(this.taskTitle, this.taskDescription, dueDate, this.taskImageUrl);
        
        this.taskTitle = '';
        this.taskDescription = '';
        this.taskDueDate = new Date().toISOString();
        this.taskImageUrl = undefined;
      }, 'Görev başarıyla eklendi', 'Görev eklenirken');
    }
  }

  async captureImage() {
    await this.handleOperation(async () => {
      const imageUrl = await this.firebaseService.takePicture();
      if (imageUrl) {
        this.taskImageUrl = imageUrl;
      } else {
        throw new Error('Resim alınamadı');
      }
    }, 'Resim başarıyla eklendi', 'Resim eklenirken');
  }

  async addImageToTask(task: Todo) {
    await this.handleOperation(async () => {
      const imageUrl = await this.firebaseService.takePicture();
      if (imageUrl) {
        await this.firebaseService.updateTodoImage(task.id, imageUrl);
      } else {
        throw new Error('Resim alınamadı');
      }
    }, 'Resim başarıyla eklendi', 'Resim eklenirken');
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  async toggleTaskStatus(id: number) {
    await this.handleOperation(
      async () => await this.firebaseService.toggleTodoStatus(id),
      'Görev durumu güncellendi', 
      'Görev durumu güncellenirken'
    );
  }

  async deleteTask(id: number) {
    await this.handleOperation(
      async () => await this.firebaseService.deleteTodo(id),
      'Görev silindi', 
      'Görev silinirken'
    );
  }

  async deleteTaskFromFirebase(id: number) {
    try {
      const alert = await this.createConfirmationAlert(
        'Kalıcı Silme',
        'Bu görev Firebase\'den kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
        async () => {
          await this.handleOperation(
            async () => await this.firebaseService.deleteFromFirebase(id),
            'Görev Firebase\'den kalıcı olarak silindi', 
            'Firebase\'den görev silinirken'
          );
        }
      );
      
      await alert.present();
    } catch (error) {
      console.error('Firebase\'den görev silinirken hata oluştu:', error);
      await this.presentToast('Firebase\'den görev silinirken bir hata oluştu', 'danger');
    }
  }
  
  private async createConfirmationAlert(
    header: string, 
    message: string, 
    onConfirm: () => Promise<void>
  ) {
    return this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'İptal',
          role: 'cancel'
        },
        {
          text: 'Sil',
          role: 'destructive',
          handler: async () => {
            await onConfirm();
          }
        }
      ]
    });
  }

  async editTask(task: Todo) {
    const alert = await this.createEditAlert(task);
    await alert.present();
  }
  
  private createEditAlert(task: Todo) {
    return this.alertController.create({
      header: 'Görevi Düzenle',
      inputs: [
        {
          name: 'title',
          type: 'text',
          value: task.title,
          placeholder: 'Görev başlığı'
        },
        {
          name: 'description',
          type: 'textarea',
          value: task.description,
          placeholder: 'Görev açıklaması'
        },
        {
          name: 'dueDate',
          type: 'datetime-local',
          value: task.dueDate.toISOString().slice(0, 16),
          placeholder: 'Son tarih'
        }
      ],
      buttons: [
        {
          text: 'İptal',
          role: 'cancel'
        },
        {
          text: 'Güncelle',
          handler: async (data) => {
            if (data.title.trim() !== '') {
              await this.handleOperation(async () => {
                const updates: Partial<Todo> = {
                  title: data.title,
                  description: data.description,
                  dueDate: new Date(data.dueDate)
                };
                
                await this.firebaseService.updateTodo(task.id, updates);
              }, 'Görev başarıyla güncellendi', 'Görev güncellenirken');
            }
          }
        }
      ]
    });
  }
}
