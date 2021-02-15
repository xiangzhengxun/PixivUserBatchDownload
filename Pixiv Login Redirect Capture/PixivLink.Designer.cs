
namespace Pixiv_Login_Redirect_Capture
{
    partial class PixivLink
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(PixivLink));
            this.label_pixivlink = new System.Windows.Forms.Label();
            this.textBox_pixivlink = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // label_pixivlink
            // 
            resources.ApplyResources(this.label_pixivlink, "label_pixivlink");
            this.label_pixivlink.Name = "label_pixivlink";
            // 
            // textBox_pixivlink
            // 
            resources.ApplyResources(this.textBox_pixivlink, "textBox_pixivlink");
            this.textBox_pixivlink.Name = "textBox_pixivlink";
            // 
            // PixivLink
            // 
            resources.ApplyResources(this, "$this");
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.label_pixivlink);
            this.Controls.Add(this.textBox_pixivlink);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "PixivLink";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label_pixivlink;
        private System.Windows.Forms.TextBox textBox_pixivlink;
    }
}